# Security Specification for Order Management Dashboard

## Data Invariants
1. `amount` must be a non-negative number.
2. `revenue` must be exactly 20% of `amount`.
3. `value` must be `amount - revenue`.
4. `finalValue` must be `value - (value * collaboration % / 100)`.
5. `status` must be one of ['WIP', 'NRA', 'Delivered'].
6. `deliveredDate` must be present if `status` is 'Delivered'.
7. `pin` must be a 4-digit string.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create an order as an unauthenticated user.
2. **Revenue Injection**: Attempt to create an order with `amount: 100` but `revenue: 0`.
3. **Ghost Field**: Attempt to add `isAdmin: true` to a standard order document.
4. **ID Poisoning**: Attempt to use a 1.5KB string as an Order ID.
5. **Unauthorized user creation**: A non-admin user trying to create a new user record.
6. **Self-Promotion**: A user trying to change their own role to 'admin'.
7. **Negative Amount**: Attempting to set an order amount to -500.
8. **Malicious Redirect**: Injecting a script in `transferredUrl`.
9. **Status Jumping**: Moving an order from `Delivered` back to `WIP` without proper logic (terminal state locking).
10. **PII Leak**: An unauthenticated user reading the `users` collection.
11. **Large Payload**: Attempting to upload a 2MB siteUrl string.
12. **Timestamp Forgery**: Providing a `createdAt` date from 10 years ago.

## Test Runner (Logic Overview)
The `firestore.rules` will enforce:
- `isSignedIn()` check for all read/writes.
- `isValidOrder()` for all order operations.
- `isAdmin()` check for user management.
- `isValidId()` for path variables.
- Immutability of `createdAt`.
- Server timestamp validation for `deliveredDate`.
