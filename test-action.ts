import { addUser } from './app/admin/users/server-action';

async function test() {
    const formData = new FormData();
    formData.append('username', 'manual_test_' + Date.now());
    formData.append('password', '1234');
    formData.append('role', 'customer');

    console.log('Testing addUser server action...');
    const result = await addUser(formData);
    console.log('Result:', result);
}

test();
