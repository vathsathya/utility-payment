# Security Spec

## Data Invariants
- Admin users can read, write, update, delete everything. (Driven by checking if they are admin in the `users` collection)
- The very first user acts as the initial admin (bootstrap problem - we might need to check if they log in and no other users exist).
- Viewers can only read data, not write.
- All users must be authenticated to read data.

## Identity Rules
- Only users with role `admin` in the `/users/{userId}` can perform modifications.
- Or, we create a bootstrap mechanism - the user's email matching a hardcoded list, or just any authenticated user can create a user doc if none exist? Wait, for standard apps we can use the "implicit" bootstrap by trusting a specific email or any authenticated user for the first write if they have no user document. Or better, just authorize the email from the runtime context as an admin for bootstrapping.
Let's use `env.VITE_ADMIN_EMAIL` passed during build... wait, rules are decoupled from vite. We can hardcode the user email for bootstrapping or provide an admin escape hatch based on their email string. The user email from runtime is `vath.sathya@gmail.com`.

## Dirty Dozen Payloads
1. Create user with missing role.
2. Edit role directly.
3. Inject large string in `houseId`.
...

