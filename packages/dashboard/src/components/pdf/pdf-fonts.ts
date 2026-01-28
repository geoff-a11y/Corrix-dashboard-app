import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

// Register fonts for PDF generation (called lazily when needed)
export function registerFonts() {
  if (fontsRegistered) return;

  try {
    // Young Serif - for headings
    Font.register({
      family: 'YoungSerif',
      src: '/fonts/YoungSerif-Regular.ttf',
    });

    // Open Sans - for body text
    Font.register({
      family: 'OpenSans',
      fonts: [
        { src: '/fonts/OpenSans-Regular.ttf', fontWeight: 'normal' },
        { src: '/fonts/OpenSans-Medium.ttf', fontWeight: 500 },
        { src: '/fonts/OpenSans-SemiBold.ttf', fontWeight: 600 },
        { src: '/fonts/OpenSans-Bold.ttf', fontWeight: 'bold' },
      ],
    });

    // Disable hyphenation
    Font.registerHyphenationCallback((word) => [word]);

    fontsRegistered = true;
  } catch (error) {
    console.warn('[PDF Fonts] Failed to register fonts:', error);
  }
}
