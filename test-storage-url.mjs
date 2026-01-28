import { storagePut } from './server/storage.ts';

async function test() {
  try {
    const testData = Buffer.from('test content');
    const result = await storagePut('test/sample-' + Date.now() + '.txt', testData, 'text/plain');
    console.log('Storage URL:', result.url);
    console.log('Is presigned?', result.url.includes('X-Amz-Signature') || result.url.includes('Signature=') || result.url.includes('?'));
    
    // 测试URL是否可以访问
    const response = await fetch(result.url);
    console.log('URL accessible?', response.ok);
    console.log('Response status:', response.status);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
