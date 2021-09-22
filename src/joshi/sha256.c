// Source: https://code.woboq.org/userspace/glibc/crypt/sha256.c.html

/* Functions to compute SHA256 message digest of files or memory blocks.
   according to the definition of SHA256 in FIPS 180-2.
   Copyright (C) 2007-2019 Free Software Foundation, Inc.
   This file is part of the GNU C Library.
   The GNU C Library is free software; you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public
   License as published by the Free Software Foundation; either
   version 2.1 of the License, or (at your option) any later version.
   The GNU C Library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Lesser General Public License for more details.
   You should have received a copy of the GNU Lesser General Public
   License along with the GNU C Library; if not, see
   <http://www.gnu.org/licenses/>.  */
/* Written by Ulrich Drepper <drepper@redhat.com>, 2007.  */
#ifdef HAVE_CONFIG_H
# include <config.h>
#endif
#include <endian.h>
#include <limits.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <sys/types.h>

/* Structure to save state of computation between the single steps.  */
struct sha256_ctx
{
  uint32_t H[8];
  union
  {
    uint64_t total64;
#define TOTAL64_low (1 - (BYTE_ORDER == LITTLE_ENDIAN))
#define TOTAL64_high (BYTE_ORDER == LITTLE_ENDIAN)
    uint32_t total[2];
  };
  uint32_t buflen;
  union
  {
    char buffer[128];
    uint32_t buffer32[32];
    uint64_t buffer64[16];
  };
};


#if __BYTE_ORDER == __LITTLE_ENDIAN
# ifdef _LIBC
#  include <byteswap.h>
#  define SWAP(n) bswap_32 (n)
#  define SWAP64(n) bswap_64 (n)
# else
#  define SWAP(n) \
    (((n) << 24) | (((n) & 0xff00) << 8) | (((n) >> 8) & 0xff00) | ((n) >> 24))
#  define SWAP64(n) \
  (((n) << 56)                                        \
   | (((n) & 0xff00) << 40)                        \
   | (((n) & 0xff0000) << 24)                        \
   | (((n) & 0xff000000) << 8)                        \
   | (((n) >> 8) & 0xff000000)                        \
   | (((n) >> 24) & 0xff0000)                        \
   | (((n) >> 40) & 0xff00)                        \
   | ((n) >> 56))
# endif
#else
# define SWAP(n) (n)
# define SWAP64(n) (n)
#endif
/* This array contains the bytes used to pad the buffer to the next
   64-byte boundary.  (FIPS 180-2:5.1.1)  */
static const unsigned char fillbuf[64] = { 0x80, 0 /* , 0, 0, ...  */ };
/* Constants for SHA256 from FIPS 180-2:4.2.2.  */
static const uint32_t K[64] =
  {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  };
static void __sha256_process_block (const void *, size_t, struct sha256_ctx *);
/* Initialize structure containing state of computation.
   (FIPS 180-2:5.3.2)  */
static void
__sha256_init_ctx (struct sha256_ctx *ctx)
{
  ctx->H[0] = 0x6a09e667;
  ctx->H[1] = 0xbb67ae85;
  ctx->H[2] = 0x3c6ef372;
  ctx->H[3] = 0xa54ff53a;
  ctx->H[4] = 0x510e527f;
  ctx->H[5] = 0x9b05688c;
  ctx->H[6] = 0x1f83d9ab;
  ctx->H[7] = 0x5be0cd19;
  ctx->total64 = 0;
  ctx->buflen = 0;
}
/* Process the remaining bytes in the internal buffer and the usual
   prolog according to the standard and write the result to RESBUF.
   IMPORTANT: On some systems it is required that RESBUF is correctly
   aligned for a 32 bits value.  */
static void *
__sha256_finish_ctx (struct sha256_ctx *ctx, void *resbuf)
{
  /* Take yet unprocessed bytes into account.  */
  uint32_t bytes = ctx->buflen;
  size_t pad;
  /* Now count remaining bytes.  */
  ctx->total64 += bytes;
  pad = bytes >= 56 ? 64 + 56 - bytes : 56 - bytes;
  memcpy (&ctx->buffer[bytes], fillbuf, pad);
  /* Put the 64-bit file length in *bits* at the end of the buffer.  */
#if _STRING_ARCH_unaligned
  ctx->buffer64[(bytes + pad) / 8] = SWAP64 (ctx->total64 << 3);
#else
  ctx->buffer32[(bytes + pad + 4) / 4] = SWAP (ctx->total[TOTAL64_low] << 3);
  ctx->buffer32[(bytes + pad) / 4] = SWAP ((ctx->total[TOTAL64_high] << 3)
                                           | (ctx->total[TOTAL64_low] >> 29));
#endif
  /* Process last bytes.  */
  __sha256_process_block (ctx->buffer, bytes + pad + 8, ctx);
  /* Put result from CTX in first 32 bytes following RESBUF.  */
  for (unsigned int i = 0; i < 8; ++i)
    ((uint32_t *) resbuf)[i] = SWAP (ctx->H[i]);
  return resbuf;
}
static void
__sha256_process_bytes (const void *buffer, size_t len, struct sha256_ctx *ctx)
{
  /* When we already have some bits in our internal buffer concatenate
     both inputs first.  */
  if (ctx->buflen != 0)
    {
      size_t left_over = ctx->buflen;
      size_t add = 128 - left_over > len ? len : 128 - left_over;
      memcpy (&ctx->buffer[left_over], buffer, add);
      ctx->buflen += add;
      if (ctx->buflen > 64)
        {
          __sha256_process_block (ctx->buffer, ctx->buflen & ~63, ctx);
          ctx->buflen &= 63;
          /* The regions in the following copy operation cannot overlap.  */
          memcpy (ctx->buffer, &ctx->buffer[(left_over + add) & ~63],
                  ctx->buflen);
        }
      buffer = (const char *) buffer + add;
      len -= add;
    }
  /* Process available complete blocks.  */
  if (len >= 64)
    {
#if !_STRING_ARCH_unaligned
/* To check alignment gcc has an appropriate operator.  Other
   compilers don't.  */
# if __GNUC__ >= 2
#  define UNALIGNED_P(p) (((uintptr_t) p) % __alignof__ (uint32_t) != 0)
# else
#  define UNALIGNED_P(p) (((uintptr_t) p) % sizeof (uint32_t) != 0)
# endif
      if (UNALIGNED_P (buffer))
        while (len > 64)
          {
            __sha256_process_block (memcpy (ctx->buffer, buffer, 64), 64, ctx);
            buffer = (const char *) buffer + 64;
            len -= 64;
          }
      else
#endif
        {
          __sha256_process_block (buffer, len & ~63, ctx);
          buffer = (const char *) buffer + (len & ~63);
          len &= 63;
        }
    }
  /* Move remaining bytes into internal buffer.  */
  if (len > 0)
    {
      size_t left_over = ctx->buflen;
      memcpy (&ctx->buffer[left_over], buffer, len);
      left_over += len;
      if (left_over >= 64)
        {
          __sha256_process_block (ctx->buffer, 64, ctx);
          left_over -= 64;
          memcpy (ctx->buffer, &ctx->buffer[64], left_over);
        }
      ctx->buflen = left_over;
    }
}

/* Process LEN bytes of BUFFER, accumulating context into CTX.
   It is assumed that LEN % 64 == 0.  */
static void
__sha256_process_block (const void *buffer, size_t len, struct sha256_ctx *ctx)
{
  const uint32_t *words = buffer;
  size_t nwords = len / sizeof (uint32_t);
  uint32_t a = ctx->H[0];
  uint32_t b = ctx->H[1];
  uint32_t c = ctx->H[2];
  uint32_t d = ctx->H[3];
  uint32_t e = ctx->H[4];
  uint32_t f = ctx->H[5];
  uint32_t g = ctx->H[6];
  uint32_t h = ctx->H[7];
  /* First increment the byte count.  FIPS 180-2 specifies the possible
     length of the file up to 2^64 bits.  Here we only compute the
     number of bytes.  */
  ctx->total64 += len;
  /* Process all bytes in the buffer with 64 bytes in each round of
     the loop.  */
  while (nwords > 0)
    {
      uint32_t W[64];
      uint32_t a_save = a;
      uint32_t b_save = b;
      uint32_t c_save = c;
      uint32_t d_save = d;
      uint32_t e_save = e;
      uint32_t f_save = f;
      uint32_t g_save = g;
      uint32_t h_save = h;
      /* Operators defined in FIPS 180-2:4.1.2.  */
#define Ch(x, y, z) ((x & y) ^ (~x & z))
#define Maj(x, y, z) ((x & y) ^ (x & z) ^ (y & z))
#define S0(x) (CYCLIC (x, 2) ^ CYCLIC (x, 13) ^ CYCLIC (x, 22))
#define S1(x) (CYCLIC (x, 6) ^ CYCLIC (x, 11) ^ CYCLIC (x, 25))
#define R0(x) (CYCLIC (x, 7) ^ CYCLIC (x, 18) ^ (x >> 3))
#define R1(x) (CYCLIC (x, 17) ^ CYCLIC (x, 19) ^ (x >> 10))
      /* It is unfortunate that C does not provide an operator for
         cyclic rotation.  Hope the C compiler is smart enough.  */
#define CYCLIC(w, s) ((w >> s) | (w << (32 - s)))
      /* Compute the message schedule according to FIPS 180-2:6.2.2 step 2.  */
      for (unsigned int t = 0; t < 16; ++t)
        {
          W[t] = SWAP (*words);
          ++words;
        }
      for (unsigned int t = 16; t < 64; ++t)
        W[t] = R1 (W[t - 2]) + W[t - 7] + R0 (W[t - 15]) + W[t - 16];
      /* The actual computation according to FIPS 180-2:6.2.2 step 3.  */
      for (unsigned int t = 0; t < 64; ++t)
        {
          uint32_t T1 = h + S1 (e) + Ch (e, f, g) + K[t] + W[t];
          uint32_t T2 = S0 (a) + Maj (a, b, c);
          h = g;
          g = f;
          f = e;
          e = d + T1;
          d = c;
          c = b;
          b = a;
          a = T1 + T2;
        }
      /* Add the starting values of the context according to FIPS 180-2:6.2.2
         step 4.  */
      a += a_save;
      b += b_save;
      c += c_save;
      d += d_save;
      e += e_save;
      f += f_save;
      g += g_save;
      h += h_save;
      /* Prepare for the next round.  */
      nwords -= 16;
    }
  /* Put checksum in context given as argument.  */
  ctx->H[0] = a;
  ctx->H[1] = b;
  ctx->H[2] = c;
  ctx->H[3] = d;
  ctx->H[4] = e;
  ctx->H[5] = f;
  ctx->H[6] = g;
  ctx->H[7] = h;
}















#if 0

// Source: https://github.com/EddieEldridge/SHA256-in-C/blob/master/SHA256.c

// Author: Edward Eldridge 
// Program: SHA-256 Algorithm implentation in C
// Resources: https://github.com/EddieEldridge/SHA256-in-C/blob/master/README.md
// Section Reference: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf

#include <stdlib.h>
#include <string.h>
#include <inttypes.h>
#include <stdbool.h>

#define byteSwap32(x) (((x) >> 24) | (((x)&0x00FF0000) >> 8) | (((x)&0x0000FF00) << 8) | ((x) << 24))
#define byteSwap64(x)                                                      \
	((((x) >> 56) & 0x00000000000000FF) | (((x) >> 40) & 0x000000000000FF00) | \
	 (((x) >> 24) & 0x0000000000FF0000) | (((x) >> 8) & 0x00000000FF000000) |  \
	 (((x) << 8) & 0x000000FF00000000) | (((x) << 24) & 0x0000FF0000000000) |  \
	 (((x) << 40) & 0x00FF000000000000) | (((x) << 56) & 0xFF00000000000000))

// Define a union for easy reference
// Union represents a message block
union messageBlock
{
    __uint8_t e[64];
    __uint32_t t[16];
    __uint64_t s[8];
};

// ENUM to control state of the program
enum status{READ, 
            PAD0,
            PAD1,
            FINISH
            };

// Tell our preprocessor to create a variable MAXCHAR with value of 100000
#define MAXCHAR 100000

// Function decleration
// See Section 4.1.2
static __uint32_t sig0(__uint32_t x);
static __uint32_t sig1(__uint32_t x);

static __uint32_t rotr(__uint32_t n, __uint16_t x);
static __uint32_t shr(__uint32_t n, __uint16_t x);

static __uint32_t SIG0(__uint32_t x);
static __uint32_t SIG1(__uint32_t x);

static __uint32_t Ch(__uint32_t x,__uint32_t y,__uint32_t z);
static __uint32_t Maj(__uint32_t x,__uint32_t y,__uint32_t z);

static _Bool endianCheck();
static int fillMessageBlock(void* data, size_t count, size_t* pos, union messageBlock *msgBlock, enum status *state, __uint64_t *numBits);
static void sha256(void *data, size_t count, void* hash);

// === Functions ===
static void sha256(void* data, size_t count, void* hash)
{   
    // Variables
    // The current message block
    union messageBlock msgBlock;

    // The number of bits read from the file
    __uint64_t numBits = 0;

    // The state of the program
    enum status state = READ;

    // Declare the K constant
    // Defined in Section 4.2.2
    __uint32_t K[] =
    {
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    };

    // Message schedule
    __uint32_t W[64];

    // Working variables
    __uint32_t a, b, c, d, e, f, g, h;

    // Temp variables
    __uint32_t T1;
    __uint32_t T2;

    // Hash values
    // Taken from https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
    __uint32_t H[8] = {
        0x6a09e667,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19
    };

    // The current message block

    // For loop to iterate through the message block 
    int j;
    int o;
	size_t pos = 0;

    while(fillMessageBlock(data, count, &pos, &msgBlock, &state, &numBits))
    {
        for(j=0; j<16; j++)
        {   
            // Fist check for big or little endian
            // If our system is big endian we dont need to do any conversion
            if(endianCheck()==true)
            {
                W[j] = msgBlock.t[j];
            }
            else
            {
                // Add the current message block to our messag schedule
                // Convert to big endian first
                W[j] = byteSwap32(msgBlock.t[j]);
            }
           
        }

        for (j=16; j<64; j++)
        {
            // Step 1
            W[j] = sig1(W[j-2]) + W[j-7] + sig0(W[j-15]) + W[j-16];
        }


        // Initalize a..h
        // Step 2
        a=H[0];
        b=H[1];
        c=H[2];
        d=H[3];
        e=H[4];
        f=H[5];
        g=H[6];
        h=H[7];

        // For loop
        // Step 3
        for(j = 0; j < 64; j++)
        {
            // Creating new variables
            T1 = h + SIG1(e) + Ch(e,f,g) + K[j] + W[j];
            T2 = SIG0(a) + Maj(a,b,c);
            h = g;
            g = f;
            f = e;
            e = d + T1;
            d = c;
            c = b;
            b = a;
            a = T1 + T2;
        }

        // Step 4
        H[0] = a + H[0];
        H[1] = b + H[1];
        H[2] = c + H[2];
        H[3] = d + H[3];
        H[4] = e + H[4];
        H[5] = f + H[5];
        H[6] = g + H[6];
        H[7] = h + H[7];
    
    }// end while
    
    // Print the results
	__uint32_t* HH = (__uint32_t*)hash;

	if(endianCheck()==true)
	{
		for (int i = 0; i < 8; i++) {
			HH[i] = H[i];
		}
	}
	else
	{
		for (int i = 0; i < 8; i++) {
			HH[i] = byteSwap32(H[i]);
		}
	}
}

// This function is used to handle the opening and reading of files
static int fillMessageBlock(void* data, size_t count, size_t* pos, union messageBlock *msgBlock, enum status *state, __uint64_t *numBits)
{   
    // Variables
    __uint64_t numBytes;
    int i;

    // If we've finished padding and processing all the message blocks, exit
    if(*state == FINISH)
    {
        return 0;
    }

    // Handle our PAD0 and PAD1 states
    // Check if we need another block full of padding
    if(*state == PAD0 || *state == PAD1)
    {
        // Set the first 56 bytes to all zero bits
        for(i=0; i<56; i++)
        {
            msgBlock->e[i] = 0x00;
        }

        // Set the last 64 bits to an integer (should be big endian)
        msgBlock->s[7] = byteSwap64(*numBits);

        // Set the state to finish
        *state = FINISH;

        // If state is PAD1, set the first bit of msgBlock to 1
        if(*state == PAD1)
        {
            // 0x80 = 10000000
            msgBlock->e[0] = 0x01;
        }

        // keep the loop in SHA256 going for one more iteration
        return 1;
    }

    // Read bytes instead of characters
    // Read until the end of the file
	numBytes = 64;

	if (*pos + numBytes >= count) {
		numBytes = count - *pos;
	}

	memcpy(msgBlock->e, ((char*)data) + *pos, numBytes);

	*pos += numBytes;
    
    // Keep track of the number of bytes we've read
    *numBits = *numBits + (numBytes * 8);
    
    // If theres enough room to finish the padding
    if(numBytes < 56)
    {
        // 0x80 = 10000000
        // Add the one bit, as per the standard before padding with 0s
        msgBlock->e[numBytes] = 0x80;

        // Add 0 bits until the last 64 bits
        while(numBytes < 56)
        {
            // Add the index into our block
            numBytes = numBytes +1;
            
            // Add enough zeroes so that there are 64 bits left at the end
            msgBlock->e[numBytes] = 0x00;
        }

        // Store the length of the file in bits as a (Should be big endian) unsigned 64 bit int
        msgBlock->s[7] = byteSwap64(*numBits);

        // Change the state of our program
        *state = FINISH;
    }
    // Otherwise, check if we can put some padding into this message block
    else if(numBytes < 64)
    {   
        // Set the state to PAD0
        *state = PAD0;
        
        // 0x80 = 10000000
        // Add the one bit into the current message block
        msgBlock->e[numBytes] = 0x80;

        // Pad the rest of the message block with 0 bits
        while(numBytes < 64)
        {
            numBytes = numBytes + 1;
            msgBlock->e[numBytes] = 0x00;
        }
    }
    // Otherwise if we're at the end of the file, need to create a new message block full of padding
    else if(numBytes == 0)
    {
        // Set the state to PAD1
        // We need a message Block full of padding
        *state = PAD1;
    }
    
    return 1;
}
    
static _Bool endianCheck()
{
    int num = 1 ;
        if(*(char *)&num == 1) {
                return false;
        } else {
                return true;
        }
}

// Section 4.1.2  
// ROTR = Rotate Right 
// SHR = Shift Right
// ROTR_n(x) = (x >> n) | (x << (32-n))
// SHR_n(x) = (x >> n)
static __uint32_t sig0(__uint32_t x)
{
    // Section 3.2
	return (rotr(x, 7) ^ rotr(x, 18) ^ shr(x, 3));
};

static __uint32_t sig1(__uint32_t x)
{
	return (rotr(x, 17) ^ rotr(x, 19) ^ shr(x, 10));
};

// Rotate bits right
static __uint32_t rotr(__uint32_t x, __uint16_t a)
{
	return (x >> a) | (x << (32 - a));
};

// Shift bits right
static __uint32_t shr(__uint32_t x, __uint16_t b)
{
	return (x >> b);
};

static __uint32_t SIG0(__uint32_t x)
{
	return (rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22));
};

static __uint32_t SIG1(__uint32_t x)
{
	return (rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25));
};

// Choose
static __uint32_t Ch(__uint32_t x,__uint32_t y,__uint32_t z)
{
	return ((x & y) ^ (~(x)&z));
};

// Majority decision
static __uint32_t Maj(__uint32_t x,__uint32_t y,__uint32_t z)
{
	return ((x & y) ^ (x & z) ^ (y & z));
};

#endif
