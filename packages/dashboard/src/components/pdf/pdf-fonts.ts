import { Font } from '@react-pdf/renderer';

// Register fonts for PDF generation
export function registerFonts() {
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
}

// Call registration immediately
registerFonts();
