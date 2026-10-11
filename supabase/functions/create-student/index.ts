// ===================================================================
// SUPABASE EDGE FUNCTION: create-student
// SERVER-SIDE STUDENT ACCOUNT CREATION USING AUTH ADMIN API
// ===================================================================
// PERINGATAN KEAMANAN:
// Berkas ini dieksekusi di server Deno Supabase Edge Functions.
// SUPABASE_SERVICE_ROLE_KEY hanya ada di server dan tidak pernah terekspos ke browser.
// Prinsip: 1 Siswa = 1 Akun Auth = 1 auth_user_id = 1 Portal Pribadi
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
        JSON.stringify({ error: 'Server configuration error: Service role key is missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verifikasi Pemanggil (Hanya Admin yang Berhak Membuat Akun)
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

    // Cek role pemanggil di profiles
    const { data: callerProfile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Hanya administrator yang berhak membuat akun siswa.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Baca Body Permintaan
    const { student_id, email, password, nis, name, class_id } = await req.json();

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

    let targetStudentId = student_id;
    let studentFullName = name ? name.trim() : '';

    // ===================================================================
    // KASUS A: Admin memilih siswa yang sudah ada di tabel students (student_id diberikan)
    // ===================================================================
    if (student_id) {
      const { data: existingStudent, error: findError } = await adminClient
        .from('students')
        .select('*')
        .eq('id', student_id)
        .maybeSingle();

      if (findError || !existingStudent) {
        return new Response(
          JSON.stringify({ error: 'Data siswa yang dipilih tidak ditemukan dalam database.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validasi ketat: 1 Siswa = 1 Akun Auth (Tolak akun kedua)
      if (existingStudent.auth_user_id) {
        return new Response(
          JSON.stringify({
            error: `Siswa "${existingStudent.name}" (NIS: ${existingStudent.nis}) sudah memiliki akun Supabase Auth aktif (UID: ${existingStudent.auth_user_id}). Sistem menolak pembuatan akun kedua.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      studentFullName = existingStudent.name;
      targetStudentId = existingStudent.id;
    } else {
      // ===================================================================
      // KASUS B: Admin membuat siswa baru sekaligus akun (nis dan name diberikan)
      // ===================================================================
      if (!nis || !name) {
        return new Response(
          JSON.stringify({ error: 'NIS dan Nama Siswa wajib diisi jika membuat siswa baru.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: existingStudent } = await adminClient
        .from('students')
        .select('id, name, auth_user_id')
        .eq('nis', nis.trim())
        .maybeSingle();

      if (existingStudent) {
        if (existingStudent.auth_user_id) {
          return new Response(
            JSON.stringify({
              error: `NIS ${nis} sudah terdaftar atas nama "${existingStudent.name}" dan sudah memiliki akun aktif.`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Jika sudah ada record siswa tapi belum punya akun, gunakan record tersebut
        targetStudentId = existingStudent.id;
        studentFullName = existingStudent.name;
      }
    }

    // 3. Buat Akun Pengguna di Supabase Auth via Admin API
    const { data: authCreated, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: studentFullName,
        role: 'student',
        student_id: targetStudentId,
      },
    });

    if (createAuthError || !authCreated.user) {
      return new Response(
        JSON.stringify({
          error: createAuthError?.message || 'Gagal membuat akun auth siswa di Supabase.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authCreated.user.id;

    // 4. Buat / Perbarui Record di public.profiles
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: newUserId,
      full_name: studentFullName,
      role: 'student',
    });

    if (profileError) {
      // Rollback auth user jika profiles gagal
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Gagal membuat profil pengguna: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Hubungkan ke Data Siswa (students.auth_user_id)
    let studentRecord = null;

    if (targetStudentId) {
      // Update record siswa yang sudah ada
      const { data: updatedStudent, error: updateError } = await adminClient
        .from('students')
        .update({
          auth_user_id: newUserId,
          email: email.trim(),
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetStudentId)
        .select()
        .single();

      if (updateError) {
        // Rollback aman: Hapus auth user yang baru dibuat agar tidak meninggalkan akun menggantung
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({
            error: `Gagal menautkan auth_user_id ke data siswa: ${updateError.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      studentRecord = updatedStudent;
    } else {
      // Insert siswa baru dengan relasi 1:1 auth_user_id
      const { data: insertedStudent, error: insertError } = await adminClient
        .from('students')
        .insert({
          auth_user_id: newUserId,
          nis: nis.trim(),
          name: name.trim(),
          email: email.trim(),
          class_id: class_id || null,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        // Rollback aman
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({
            error: `Gagal menyimpan data siswa baru: ${insertError.message}`,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      studentRecord = insertedStudent;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Akun siswa "${studentFullName}" berhasil dibuat dan ditautkan secara eksklusif ke UID: ${newUserId}`,
        student: studentRecord,
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
