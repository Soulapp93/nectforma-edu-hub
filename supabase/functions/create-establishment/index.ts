import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EstablishmentData {
  name: string;
  type: string;
  email: string;
  address?: string;
  phone?: string;
  website?: string;
  siret?: string;
  director?: string;
  numberOfStudents?: string;
  numberOfInstructors?: string;
}

interface AdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  let establishmentId: string | null = null;
  let authUserId: string | null = null;

  try {
    const { establishment, admin }: { establishment: EstablishmentData; admin: AdminData } = await req.json();

    // Validation
    if (!establishment?.name || !establishment?.type || !admin?.email || !admin?.password) {
      throw new Error('Données manquantes: nom, type, email et mot de passe sont requis');
    }

    if (admin.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    console.log('=== Starting establishment creation ===');
    console.log('Establishment:', establishment.name);
    console.log('Admin email:', admin.email);

    // Step 1: Create establishment
    const { data: establishmentData, error: establishmentError } = await supabaseAdmin
      .from('establishments')
      .insert({
        name: establishment.name.trim(),
        type: establishment.type,
        email: (establishment.email || admin.email).trim().toLowerCase(),
        address: establishment.address?.trim() || null,
        phone: establishment.phone?.trim() || null,
        website: establishment.website?.trim() || null,
        siret: establishment.siret?.trim() || null,
        director: establishment.director?.trim() || null,
        number_of_students: establishment.numberOfStudents || null,
        number_of_instructors: establishment.numberOfInstructors || null
      })
      .select()
      .single();

    if (establishmentError) {
      console.error('Establishment creation error:', establishmentError);
      throw new Error(`Erreur création établissement: ${establishmentError.message}`);
    }

    establishmentId = establishmentData.id;
    console.log('✓ Establishment created:', establishmentId);

    // Step 2: Check if auth user already exists
    const normalizedEmail = admin.email.trim().toLowerCase();
    
    // First, try to create a new user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: admin.password,
      email_confirm: true,
      user_metadata: {
        first_name: admin.firstName.trim(),
        last_name: admin.lastName.trim(),
        phone: admin.phone?.trim() || '',
        establishment_id: establishmentId
      }
    });

    if (authError) {
      console.log('Auth creation response:', authError.message);
      
      if (authError.message.includes('already') || authError.message.includes('registered') || authError.message.includes('exists')) {
        // User exists - search for them
        console.log('User already exists, searching...');
        
        let foundUser = null;
        let page = 1;
        const perPage = 1000;
        
        while (!foundUser && page <= 10) { // Max 10 pages to prevent infinite loop
          const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage
          });
          
          if (listError) {
            console.error('Error listing users:', listError);
            break;
          }
          
          foundUser = usersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
          
          if (foundUser || usersData.users.length < perPage) break;
          page++;
        }
        
        if (foundUser) {
          console.log('✓ Found existing user:', foundUser.id);
          authUserId = foundUser.id;
          
          // Update user with new password and metadata
          await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
            password: admin.password,
            email_confirm: true,
            user_metadata: {
              first_name: admin.firstName.trim(),
              last_name: admin.lastName.trim(),
              phone: admin.phone?.trim() || '',
              establishment_id: establishmentId
            }
          });
        } else {
          throw new Error(`L'email ${admin.email} est déjà utilisé. Veuillez utiliser un autre email ou vous connecter.`);
        }
      } else {
        throw new Error(`Erreur création compte: ${authError.message}`);
      }
    } else {
      authUserId = authData.user.id;
      console.log('✓ New auth user created:', authUserId);
    }

    // Step 3: Create or update user profile with AdminPrincipal role
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .maybeSingle();

    const userProfileData = {
      first_name: admin.firstName.trim(),
      last_name: admin.lastName.trim(),
      email: normalizedEmail,
      phone: admin.phone?.trim() || null,
      role: 'AdminPrincipal' as const,
      establishment_id: establishmentId,
      status: 'Actif' as const,
      is_activated: true
    };

    if (existingProfile) {
      console.log('Updating existing profile...');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update(userProfileData)
        .eq('id', authUserId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Non-fatal error, continue
      }
    } else {
      console.log('Creating new profile...');
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUserId,
          ...userProfileData
        });

      if (insertError) {
        console.error('Profile insert error:', insertError);
        // Try update instead (might have been created by trigger)
        await supabaseAdmin
          .from('users')
          .update(userProfileData)
          .eq('id', authUserId);
      }
    }

    console.log('✓ User profile configured');
    console.log('=== Establishment creation completed successfully ===');

    return new Response(
      JSON.stringify({
        success: true,
        establishmentId,
        userId: authUserId,
        message: 'Compte établissement créé avec succès'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('=== Error in create-establishment ===');
    console.error('Error:', error.message);

    // Rollback: delete establishment if it was created
    if (establishmentId) {
      console.log('Rolling back: deleting establishment', establishmentId);
      await supabaseAdmin.from('establishments').delete().eq('id', establishmentId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue lors de la création du compte'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
