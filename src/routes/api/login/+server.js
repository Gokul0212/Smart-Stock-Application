import { json } from '@sveltejs/kit';
import { srvGetUserByUsernameOrEmail } from '$lib/server/db.js';

export async function POST({ request }) {
  try {
    const { usernameOrEmail, password } = await request.json();

    if (!usernameOrEmail || !password) {
      return json({ success: false, message: "Username/Email and Password are required." }, { status: 400 });
    }

    const user = await srvGetUserByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      return json({ success: false, message: "User not found." }, { status: 400 });
    }

    if (user.password !== password) {
      return json({ success: false, message: "Incorrect password." }, { status: 400 });
    }

    // Omit password from session response
    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name || user.username
    };

    return json({ success: true, user: sessionUser }, { status: 200 });

  } catch (error) {
    return json({ success: false, message: "Internal server error: " + error.message }, { status: 500 });
  }
}
