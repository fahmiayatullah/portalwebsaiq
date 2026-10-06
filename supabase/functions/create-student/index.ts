// ===================================================================
// SUPABASE EDGE FUNCTION: create-student
// SERVER-SIDE STUDENT ACCOUNT CREATION USING AUTH ADMIN API
// ===================================================================
// PERINGATAN KEAMANAN:
// Berkas ini dieksekusi di server Deno Supabase Edge Functions.
// SUPABASE_SERVICE_ROLE_KEY hanya ada di server dan tidak pernah terekspos ke browser.
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
    const { email, password, nis, name, class_id } = await req.json();

    if (!email || !password || !nis || !name) {
      return new Response(
        JSON.stringify({ error: 'Semua bidang wajib diisi (email, password, nis, name).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inisialisasi Admin Client dengan Service Role Key
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 3. Validasi Keunikan NIS (Satu siswa = satu akun)
    const { data: existingStudent } = await adminClient
      .from('students')
      .select('id')
      .eq('nis', nis.trim())
      .maybeSingle();

    if (existingStudent) {
      return new Response(
        JSON.stringify({ error: `NIS ${nis} sudah terdaftar dalam sistem.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Buat Akun Pengguna di Supabase Auth via Admin API
    const { data: authCreated, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name.trim(), role: 'student' },
    });

    if (createAuthError || !authCreated.user) {
      return new Response(
        JSON.stringify({ error: createAuthError?.message || 'Gagal membuat akun auth siswa.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authCreated.user.id;

    // 5. Buat Record Profiles
    await adminClient.from('profiles').insert({
      id: newUserId,
      full_name: name.trim(),
      role: 'student',
    });

    // 6. Buat Record Students (Relasi 1:1 auth_user_id)
    const { data: studentRecord, error: studentInsertError } = await adminClient
      .from('students')
      .insert({
        auth_user_id: newUserId,
        nis: nis.trim(),
        name: name.trim(),
        class_id: class_id || null,
        status: 'active',
      })
      .select()
      .single();

    if (studentInsertError) {
      // Rollback auth user jika insert student gagal
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Gagal membuat profil siswa: ${studentInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Akun siswa berhasil dibuat dengan aman.',
        student: studentRecord,
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
