// ===================================================================
// SUPABASE EDGE FUNCTION: create-teacher
// SERVER-SIDE TEACHER ACCOUNT CREATION USING AUTH ADMIN API
// ===================================================================
// PERINGATAN KEAMANAN:
// Berkas ini dieksekusi di server Deno Supabase Edge Functions.
// SUPABASE_SERVICE_ROLE_KEY hanya ada di server dan tidak pernah terekspos ke browser.
// Prinsip: 1 Guru = 1 Akun Auth = 1 teachers.auth_user_id = 1 Portal Guru Pribadi
// ===================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing on server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verifikasi Pemanggil (Hanya Admin yang Berhak Membuat Akun Guru)
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await userClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Autentikasi diperlukan.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cek role pemanggil di public.profiles
    const { data: callerProfile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Hanya administrator yang berhak membuat akun guru.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Baca Body Permintaan
    const { teacher_id, email, password, nip, name, title } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email dan kata sandi awal wajib diisi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Kata sandi minimal terdiri dari 6 karakter.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inisialisasi Admin Client dengan Service Role Key
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let targetTeacherId = teacher_id;
    let teacherFullName = name ? name.trim() : '';

    // ===================================================================
    // KASUS A: Admin memilih guru yang sudah ada di tabel teachers (teacher_id diberikan)
    // ===================================================================
    if (teacher_id) {
      const { data: existingTeacher, error: findError } = await adminClient
        .from('teachers')
        .select('*')
        .eq('id', teacher_id)
        .maybeSingle();

      if (findError || !existingTeacher) {
        return new Response(
          JSON.stringify({ error: 'Data guru yang dipilih tidak ditemukan dalam database.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validasi ketat: 1 Guru = 1 Akun Auth (Tolak akun kedua)
      if (existingTeacher.auth_user_id) {
        return new Response(
          JSON.stringify({
            error: `Guru "${existingTeacher.name}" (NIP: ${existingTeacher.nip}) sudah memiliki akun Supabase Auth aktif (UID: ${existingTeacher.auth_user_id}). Sistem menolak pembuatan akun kedua.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      teacherFullName = existingTeacher.name;
      targetTeacherId = existingTeacher.id;
    } else {
      // ===================================================================
      // KASUS B: Admin membuat guru baru sekaligus akun (nip dan name diberikan)
      // ===================================================================
      if (!nip || !name) {
        return new Response(
          JSON.stringify({ error: 'NIP dan Nama Guru wajib diisi jika membuat guru baru.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: existingTeacher } = await adminClient
        .from('teachers')
        .select('id, name, auth_user_id')
        .eq('nip', nip.trim())
        .maybeSingle();

      if (existingTeacher) {
        if (existingTeacher.auth_user_id) {
          return new Response(
            JSON.stringify({
              error: `NIP ${nip} sudah terdaftar atas nama "${existingTeacher.name}" dan sudah memiliki akun aktif.`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        targetTeacherId = existingTeacher.id;
        teacherFullName = existingTeacher.name;
      }
    }

    // 3. Buat Akun Pengguna di Supabase Auth via Admin API
    const { data: authCreated, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: teacherFullName,
        role: 'teacher',
        teacher_id: targetTeacherId,
      },
    });

    if (createAuthError || !authCreated.user) {
      const msg = createAuthError?.message || 'Gagal membuat akun auth guru di Supabase.';
      const friendlyMsg = msg.includes('already been registered')
        ? `Alamat email "${email}" sudah terdaftar pada pengguna lain. Harap gunakan email lain.`
        : msg;
      return new Response(
        JSON.stringify({ error: friendlyMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authCreated.user.id;

    // 4. Buat / Perbarui Record di public.profiles
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: newUserId,
      full_name: teacherFullName,
      role: 'teacher',
    });

    if (profileError) {
      // Rollback auth user jika profiles gagal
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Gagal membuat profil guru: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Hubungkan ke Data Guru (teachers.auth_user_id)
    let teacherRecord = null;

    if (targetTeacherId) {
      // Update record guru yang sudah ada
      const { data: updatedTeacher, error: updateError } = await adminClient
        .from('teachers')
        .update({
          auth_user_id: newUserId,
          email: email.trim(),
          status: 'active',
        })
        .eq('id', targetTeacherId)
        .select()
        .single();

      if (updateError) {
        // Rollback aman: Hapus auth user yang baru dibuat agar tidak meninggalkan akun menggantung
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({
            error: `Gagal menautkan auth_user_id ke data guru: ${updateError.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      teacherRecord = updatedTeacher;
    } else {
      // Insert guru baru dengan relasi 1:1 auth_user_id
      const { data: insertedTeacher, error: insertError } = await adminClient
        .from('teachers')
        .insert({
          auth_user_id: newUserId,
          nip: nip.trim(),
          name: name.trim(),
          title: title ? title.trim() : 'Tenaga Pendidik',
          email: email.trim(),
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        // Rollback aman
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({
            error: `Gagal menyimpan data guru baru: ${insertError.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      teacherRecord = insertedTeacher;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Akun guru "${teacherFullName}" berhasil dibuat dan ditautkan secara eksklusif ke UID: ${newUserId}`,
        teacher: teacherRecord,
        auth_user_id: newUserId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan internal server.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
