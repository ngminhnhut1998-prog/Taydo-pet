import PocketBase from 'pocketbase';

// NOTE: You may need to change this URL to match your PocketBase instance.
export const pb = new PocketBase('http://127.0.0.1:8090');
pb.autoCancellation(false);
