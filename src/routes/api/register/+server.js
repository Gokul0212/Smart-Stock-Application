import { json } from '@sveltejs/kit';
import { srvGetUserByUsernameOrEmail, srvAddUser } from '$lib/server/db.js';

export async function POST({ request }) {
  try {
    const { name, username, email, phone, password, role = 'user', adminCode } = await request.json();

    if (!username || !email || !password) {
      return json({ success: false, message: "Username, email, and password are required fields." }, { status: 400 });
    }

    if (role === 'admin') {
      const secretAdminCode = 'ADMIN123';
      if (adminCode !== secretAdminCode) {
        return json({ success: false, message: "Invalid Admin Security Code. Access Denied." }, { status: 403 });
      }
    }

    const existingUser = await srvGetUserByUsernameOrEmail(username);
    if (existingUser) {
      return json({ success: false, message: "Username is already taken." }, { status: 400 });
    }

    const existingEmail = await srvGetUserByUsernameOrEmail(email);
    if (existingEmail) {
      return json({ success: false, message: "Email is already registered." }, { status: 400 });
    }

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      username,
      email,
      password,
      role,
      name: name || username,
      phone: phone || ""
    };

    await srvAddUser(newUser);

    // Omit password from session response
    const sessionUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    };

    return json({ success: true, user: sessionUser }, { status: 201 });

  } catch (error) {
    return json({ success: false, message: "Internal server error: " + error.message }, { status: 500 });
  }
}
