import { View, Text } from '@react-pdf/renderer';
import { styles } from './pdf-styles';

interface PDFHeaderProps {
  credentialId: string;
  pageNumber: number;
  totalPages: number;
}

export function PDFHeader({ credentialId, pageNumber, totalPages }: PDFHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>Cx</Text>
        </View>
        <Text style={styles.headerBrand}>Corrix</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.headerCredentialId}>{credentialId}</Text>
        <Text style={styles.headerPageNumber}>
          Page {pageNumber} of {totalPages}
        </Text>
      </View>
    </View>
  );
}
