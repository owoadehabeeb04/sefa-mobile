import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Colors } from '@/constants/theme';

interface MonoConnectWidgetProps {
  visible: boolean;
  onSuccess: (code: string) => void;
  onClose: () => void;
  customer: {
    id: string;
    email?: string;
    name?: string;
  };
}

const DEFAULT_PUBLIC_KEY = 'test_pk_d57jbt0tg25gal5i85hd';

const buildMonoHtml = (publicKey: string, customerId: string, email = '', name = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body { margin: 0; padding: 0; background: #fff; }</style>
</head>
<body>
  <script src="https://connect.withmono.com/connect.js"></script>
  <script>
    var monoInstance = new Connect({
      key: "${publicKey}",
      onSuccess: function(data) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', code: data.code }));
      },
      onClose: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
      },
      data: {
        customer: {
          id: "${customerId}",
          email: "${email}",
          name: "${name}"
        }
      }
    });
    monoInstance.setup();
    monoInstance.open();
  </script>
</body>
</html>
`;

export const MonoConnectWidget: React.FC<MonoConnectWidgetProps> = ({
  visible,
  onSuccess,
  onClose,
  customer,
}) => {
  const colors = Colors.light;
  const publicKey = process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY ?? DEFAULT_PUBLIC_KEY;
  const [loading, setLoading] = React.useState(true);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success' && data.code) {
        onSuccess(data.code);
      } else if (data.type === 'close') {
        onClose();
      }
    } catch {
      // ignore parse errors
    }
  };

  const html = buildMonoHtml(
    publicKey,
    customer.id,
    customer.email ?? '',
    customer.name ?? '',
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          className="flex-row items-center px-5 py-4 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            Connect Bank
          </Text>
        </View>

        <View className="flex-1">
          {loading && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ position: 'absolute', top: '50%', alignSelf: 'center', zIndex: 1 }}
            />
          )}
          <WebView
            source={{ html }}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};
