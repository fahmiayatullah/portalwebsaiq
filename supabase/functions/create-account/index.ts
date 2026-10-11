// ===================================================================
// SUPABASE EDGE FUNCTION: create-account
// SERVER-SIDE ACCOUNT CREATION FOR STUDENTS & TEACHERS USING AUTH ADMIN API
// SDI SAIQ AL-HIKMAH
// ===================================================================
// Prinsip Keamanan & Integritas Data:
// 1. Eksekusi server-side murni: SUPABASE_SERVICE_ROLE_KEY hanya ada di server Deno.
// 2. 1 Siswa = 1 Supabase Auth User = 1 students.auth_user_id
// 3. 1 Guru = 1 Supabase Auth User = 1 teachers.auth_user_id
// 4. Verifikasi caller adalah Admin resmi (tabel public.profiles role = 'admin').
// 5. Anti-duplikasi akun (tolak pembuatan jika sudah punya auth_user_id).
// 6. Atomic rollback: jika relasi DB gagal disimpan, Auth User otomatis dihapus.
// ===================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // 1. Tangani CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Metode request tidak diizinkan. Gunakan metode POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: 'Konfigurasi server Supabase tidak lengkap: SUPABASE_SERVICE_ROLE_KEY belum terpasang di environment.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verifikasi Pemanggil (Wajib Login & Memiliki Role Admin)
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Header Authorization diperlukan.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerUser },
      error: callerError,
    } = await userClient.auth.getUser();

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Token autentikasi tidak valid atau telah kedaluwarsa.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Periksa role pemanggil di public.profiles
    const { data: callerProfile, error: profileCheckError } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .maybeSingle();

    const callerRole = callerProfile?.role || callerUser.user_metadata?.role;

    if (profileCheckError || callerRole !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Akses ditolak: Hanya administrator sekolah yang memiliki wewenang untuk membuat akun autentikasi.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Baca dan Validasi Body Permintaan
    const body = await req.json();
    const accountType = (body.account_type || body.type || '').toLowerCase();
    const { email, password } = body;

    if (!['student', 'teacher'].includes(accountType)) {
      return new Response(
        JSON.stringify({
          error: 'Parameter jenis akun (account_type) tidak valid. Pilih "student" atau "teacher".',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return new Response(
        JSON.stringify({ error: 'Alamat email wajib diisi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Kata sandi minimal harus terdiri dari 6 karakter.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Inisialisasi Admin Client dengan Service Role Key
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ===================================================================
    // PROSES UNTUK SISWA (account_type === 'student')
    // ===================================================================
    if (accountType === 'student') {
      const { student_id, nis, name, class_id } = body;
      let targetStudentId = student_id;
      let targetName = name ? String(name).trim() : '';
      let targetNis = nis ? String(nis).trim() : '';
      let targetClassId = class_id || null;

      // Kasus A: Admin memilih siswa terdaftar
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

        if (existingStudent.auth_user_id) {
          return new Response(
            JSON.stringify({
              error: `Siswa "${existingStudent.name}" (NIS: ${existingStudent.nis}) sudah memiliki akun aktif (Auth UID: ${existingStudent.auth_user_id}). Sistem menolak pembuatan akun kedua.`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        targetStudentId = existingStudent.id;
        targetName = existingStudent.name;
        targetNis = existingStudent.nis;
        targetClassId = existingStudent.class_id;
      } else {
        // Kasus B: Admin mendaftarkan siswa baru sekaligus akun
        if (!targetNis || !targetName) {
          return new Response(
            JSON.stringify({ error: 'NIS dan Nama Siswa wajib diisi jika mendaftarkan siswa baru.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: existingNis } = await adminClient
          .from('students')
          .select('id, name, auth_user_id, class_id')
          .eq('nis', targetNis)
          .maybeSingle();

        if (existingNis) {
          if (existingNis.auth_user_id) {
            return new Response(
              JSON.stringify({
                error: `NIS ${targetNis} sudah terdaftar atas nama "${existingNis.name}" dan sudah memiliki akun aktif.`,
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          targetStudentId = existingNis.id;
          targetName = existingNis.name;
          targetClassId = existingNis.class_id;
        }
      }

      // Buat user baru di Supabase Authentication via Admin API
      const { data: authCreated, error: createAuthError } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: targetName,
          role: 'student',
          nis: targetNis,
          student_id: targetStudentId,
        },
      });

      if (createAuthError || !authCreated?.user) {
        const msg = createAuthError?.message || 'Gagal membuat akun auth siswa di Supabase.';
        const friendlyMsg = msg.includes('already been registered')
          ? `Alamat email "${cleanEmail}" sudah terdaftar pada akun lain di sistem. Harap gunakan email lain.`
          : msg;
        return new Response(
          JSON.stringify({ error: friendlyMsg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newUserId = authCreated.user.id;

      // Upsert record ke public.profiles
      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: newUserId,
        full_name: targetName,
        role: 'student',
      });

      if (profileError) {
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({ error: `Gagal membuat profil siswa: ${profileError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hubungkan ke data siswa di public.students
      let studentRecord = null;
      if (targetStudentId) {
        const { data: updatedStudent, error: updateError } = await adminClient
          .from('students')
          .update({
            auth_user_id: newUserId,
            email: cleanEmail,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetStudentId)
          .select()
          .single();

        if (updateError) {
          await adminClient.auth.admin.deleteUser(newUserId);
          return new Response(
            JSON.stringify({ error: `Gagal menautkan auth_user_id ke siswa: ${updateError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        studentRecord = updatedStudent;
      } else {
        const { data: insertedStudent, error: insertError } = await adminClient
          .from('students')
          .insert({
            auth_user_id: newUserId,
            nis: targetNis,
            name: targetName,
            email: cleanEmail,
            class_id: targetClassId,
            status: 'active',
          })
          .select()
          .single();

        if (insertError) {
          await adminClient.auth.admin.deleteUser(newUserId);
          return new Response(
            JSON.stringify({ error: `Gagal menyimpan data siswa baru: ${insertError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        studentRecord = insertedStudent;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Akun siswa "${targetName}" (NIS: ${targetNis}) berhasil dibuat dan ditautkan ke Supabase Auth!`,
          auth_user_id: newUserId,
          account_type: 'student',
          student: studentRecord,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // PROSES UNTUK GURU (account_type === 'teacher')
    // ===================================================================
    if (accountType === 'teacher') {
      const { teacher_id, nip, name, title, photo_url } = body;
      let targetTeacherId = teacher_id;
      let targetName = name ? String(name).trim() : '';
      let targetNip = nip ? String(nip).trim() : '';
      let targetTitle = title ? String(title).trim() : 'Tenaga Pendidik';
      let targetPhotoUrl = photo_url || undefined;

      // Kasus A: Admin memilih guru terdaftar
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

        if (existingTeacher.auth_user_id) {
          return new Response(
            JSON.stringify({
              error: `Guru "${existingTeacher.name}" (NIP: ${existingTeacher.nip}) sudah memiliki akun aktif (Auth UID: ${existingTeacher.auth_user_id}). Sistem menolak pembuatan akun kedua.`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        targetTeacherId = existingTeacher.id;
        targetName = existingTeacher.name;
        targetNip = existingTeacher.nip;
        targetTitle = existingTeacher.title || targetTitle;
        targetPhotoUrl = existingTeacher.photo_url || targetPhotoUrl;
      } else {
        // Kasus B: Admin mendaftarkan guru baru sekaligus akun
        if (!targetNip || !targetName) {
          return new Response(
            JSON.stringify({ error: 'NIP dan Nama Guru wajib diisi jika mendaftarkan guru baru.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: existingNip } = await adminClient
          .from('teachers')
          .select('id, name, auth_user_id, title, photo_url')
          .eq('nip', targetNip)
          .maybeSingle();

        if (existingNip) {
          if (existingNip.auth_user_id) {
            return new Response(
              JSON.stringify({
                error: `NIP ${targetNip} sudah terdaftar atas nama "${existingNip.name}" dan sudah memiliki akun aktif.`,
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          targetTeacherId = existingNip.id;
          targetName = existingNip.name;
          targetTitle = existingNip.title || targetTitle;
          targetPhotoUrl = existingNip.photo_url || targetPhotoUrl;
        }
      }

      // Buat user baru di Supabase Authentication via Admin API
      const { data: authCreated, error: createAuthError } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: targetName,
          role: 'teacher',
          nip: targetNip,
          teacher_id: targetTeacherId,
        },
      });

      if (createAuthError || !authCreated?.user) {
        const msg = createAuthError?.message || 'Gagal membuat akun auth guru di Supabase.';
        const friendlyMsg = msg.includes('already been registered')
          ? `Alamat email "${cleanEmail}" sudah terdaftar pada akun lain di sistem. Harap gunakan email lain.`
          : msg;
        return new Response(
          JSON.stringify({ error: friendlyMsg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newUserId = authCreated.user.id;

      // Upsert record ke public.profiles
      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: newUserId,
        full_name: targetName,
        role: 'teacher',
      });

      if (profileError) {
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({ error: `Gagal membuat profil guru: ${profileError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hubungkan ke data guru di public.teachers
      let teacherRecord = null;
      if (targetTeacherId) {
        const { data: updatedTeacher, error: updateError } = await adminClient
          .from('teachers')
          .update({
            auth_user_id: newUserId,
            email: cleanEmail,
            status: 'active',
          })
          .eq('id', targetTeacherId)
          .select()
          .single();

        if (updateError) {
          await adminClient.auth.admin.deleteUser(newUserId);
          return new Response(
            JSON.stringify({ error: `Gagal menautkan auth_user_id ke guru: ${updateError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        teacherRecord = updatedTeacher;
      } else {
        const { data: insertedTeacher, error: insertError } = await adminClient
          .from('teachers')
          .insert({
            auth_user_id: newUserId,
            nip: targetNip,
            name: targetName,
            title: targetTitle,
            photo_url: targetPhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
            email: cleanEmail,
            status: 'active',
          })
          .select()
          .single();

        if (insertError) {
          await adminClient.auth.admin.deleteUser(newUserId);
          return new Response(
            JSON.stringify({ error: `Gagal menyimpan data guru baru: ${insertError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        teacherRecord = insertedTeacher;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Akun dewan guru "${targetName}" (NIP: ${targetNip}) berhasil dibuat dan ditautkan ke Supabase Auth!`,
          auth_user_id: newUserId,
          account_type: 'teacher',
          teacher: teacherRecord,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Permintaan tidak dapat diproses.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem internal server.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
