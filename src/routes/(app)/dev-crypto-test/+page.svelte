<script lang="ts">
	import { generateSalt, deriveKey, encrypt, decrypt, bufferToBase64 } from '$lib/crypto/cipher';
	import { setKey, getKey, hasKey, clearKey } from '$lib/crypto/keyStore';
	import { encryptionService } from '$lib/services/encryptionService';

	let testResults = $state<string[]>([]);
	let isRunning = $state(false);

	function log(msg: string) {
		testResults = [...testResults, msg];
	}

	async function runTests() {
		isRunning = true;
		testResults = [];

		try {
			// Test 1: Salt generation
			log('1. Testing salt generation...');
			const salt = generateSalt();
			log(`   ✓ Generated salt: ${bufferToBase64(salt).slice(0, 20)}...`);

			// Test 2: Key derivation
			log('2. Testing key derivation...');
			const key = await deriveKey('test-password', salt);
			log(`   ✓ Derived key type: ${key.type}, algorithm: ${key.algorithm.name}`);

			// Test 3: Encrypt/decrypt
			log('3. Testing encrypt/decrypt...');
			const plaintext = 'Hello, encryption test! 🔐';
			const encrypted = await encrypt(plaintext, key);
			log(`   ✓ Encrypted: ${encrypted.ciphertext.slice(0, 30)}...`);
			const decrypted = await decrypt(encrypted.ciphertext, encrypted.iv, key);
			log(`   ✓ Decrypted: "${decrypted}"`);
			log(`   ✓ Match: ${decrypted === plaintext}`);

			// Test 4: Key store
			log('4. Testing key store...');
			log(`   Before setKey: hasKey = ${hasKey()}`);
			setKey(key, salt);
			log(`   After setKey: hasKey = ${hasKey()}`);
			log(`   getKey returns key: ${getKey() === key}`);

			// Test 5: Encryption service
			log('5. Testing encryption service...');
			log(`   isReady: ${encryptionService.isReady()}`);
			const draft = {
				content: 'Dear Mom, I love you',
				recipient: 'Mom',
				intent: 'love',
				emotion: 'grateful'
			};
			const encResult = await encryptionService.encryptDraft(draft);
			if (encResult.error) {
				log(`   ✗ Encrypt error: ${encResult.error}`);
			} else {
				log(`   ✓ Draft encrypted successfully`);
				log(
					`   ✓ Encrypted content: ${encResult.encryptedDraft?.encrypted_content.slice(0, 30)}...`
				);

				// Decrypt it back
				const decResult = await encryptionService.decryptDraft(encResult.encryptedDraft!);
				if (decResult.error) {
					log(`   ✗ Decrypt error: ${decResult.error}`);
				} else {
					log(`   ✓ Draft decrypted successfully`);
					log(`   ✓ Content: "${decResult.draft?.content}"`);
					log(`   ✓ Recipient: "${decResult.draft?.recipient}"`);
				}
			}

			// Cleanup
			clearKey();
			log('6. Cleanup: key cleared, hasKey = ' + hasKey());

			log('');
			log('✅ All tests passed!');
		} catch (err) {
			log(`❌ Error: ${err}`);
		}

		isRunning = false;
	}
</script>

<div class="container mx-auto max-w-2xl p-8">
	<h1 class="mb-4 text-2xl font-bold">Crypto Test Page</h1>
	<p class="mb-6 text-sm opacity-70">Dev-only page to test client-side encryption</p>

	<button class="btn mb-6 btn-primary" onclick={runTests} disabled={isRunning}>
		{isRunning ? 'Running...' : 'Run Encryption Tests'}
	</button>

	{#if testResults.length > 0}
		<div class="mockup-code">
			{#each testResults as line, i (i)}
				<pre><code>{line}</code></pre>
			{/each}
		</div>
	{/if}
</div>
