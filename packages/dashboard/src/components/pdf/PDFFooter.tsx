import { View, Text, Link } from '@react-pdf/renderer';
import { styles } from './pdf-styles';

interface PDFFooterProps {
  verificationUrl: string;
}

export function PDFFooter({ verificationUrl }: PDFFooterProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerCopyright}>
        © Human Machines Group LLC 2026. All rights reserved.
      </Text>
      <Link src={verificationUrl} style={styles.footerUrl}>
        {verificationUrl}
      </Link>
    </View>
  );
}
