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

const buildCustomerPayload = (customer: MonoConnectWidgetProps['customer']) => {
  const safeEmail = String(customer.email || '').trim() || 'user@sefa.app';
  const safeName = String(customer.name || '').trim() || 'SEFA User';
  const payload: { email: string; name: string } = {
    email: safeEmail,
    name: safeName,
  };

  return payload;
};

const buildMonoHtml = (publicKey: string, customerPayload: { id?: string; email: string; name: string }) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body { margin: 0; padding: 0; background: #fff; }</style>
</head>
<body>
  <script src="https://connect.withmono.com/connect.js"></script>
  <script>
    window.onerror = function(message, source, lineno, colno) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'widget_error',
        message: String(message || 'window error'),
        source: String(source || ''),
        line: Number(lineno || 0),
        column: Number(colno || 0)
      }));
    };

    window.onunhandledrejection = function(event) {
      var reason = event && event.reason ? String(event.reason) : 'unhandled promise rejection';
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'widget_error',
        message: reason
      }));
    };

    try {
      var monoInstance = new Connect({
        key: ${JSON.stringify(publicKey)},
        onSuccess: function(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', code: data.code }));
        },
        onClose: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
        },
        data: {
          customer: ${JSON.stringify(customerPayload)}
        }
      });
      monoInstance.setup();
      monoInstance.open();
    } catch (error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'widget_error',
        message: String((error && error.message) || error || 'failed to init mono widget')
      }));
    }
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
  const publicKey = (process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY || '').trim();
  const [loading, setLoading] = React.useState(true);
  const [webViewKey, setWebViewKey] = React.useState(0);
  const [debugStatus, setDebugStatus] = React.useState<string>('');

  React.useEffect(() => {
    if (visible) {
      setLoading(true);
      setWebViewKey((current) => current + 1);
    }
  }, [visible]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success' && data.code) {
        onSuccess(data.code);
      } else if (data.type === 'close') {
        onClose();
      } else if (data.type === 'widget_error') {
        setDebugStatus(`Widget error: ${String(data.message || 'unknown')}`);
      }
    } catch {
      setDebugStatus('Widget message parse error');
    }
  };

  const customerPayload = buildCustomerPayload(customer);
  const html = buildMonoHtml(publicKey, customerPayload);
  const emailDomain = customerPayload.email.includes('@')
    ? customerPayload.email.split('@')[1]
    : 'invalid-email';
  const keyPrefix = publicKey ? publicKey.slice(0, 7) : 'missing';

  if (!publicKey) {
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
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text className="text-base font-semibold mt-3 text-center" style={{ color: colors.text }}>
              Mono public key is missing
            </Text>
            <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
              Add EXPO_PUBLIC_MONO_PUBLIC_KEY to the mobile app env and restart Expo.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

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
          {__DEV__ && (
            <View className="px-4 py-2" style={{ backgroundColor: '#F3F4F6' }}>
              {/* <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {`Debug: key=${keyPrefix}*** | nameLen=${customerPayload.name.length} | emailDomain=${emailDomain}`}
              </Text> */}
              {!!debugStatus && (
                <Text style={{ color: colors.error, fontSize: 12, marginTop: 2 }}>
                  {debugStatus}
                </Text>
              )}
            </View>
          )}
          {loading && (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ position: 'absolute', top: '50%', alignSelf: 'center', zIndex: 1 }}
            />
          )}
          <WebView
            key={webViewKey}
            source={{ html }}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            onError={(event: { nativeEvent: { description?: string } }) => {
              setDebugStatus(`WebView error: ${event.nativeEvent.description || 'unknown error'}`);
            }}
            onHttpError={(event: { nativeEvent: { statusCode?: number; url?: string } }) => {
              setDebugStatus(
                `WebView HTTP error: ${String(event.nativeEvent.statusCode || '')} ${String(event.nativeEvent.url || '')}`,
              );
            }}
            javaScriptEnabled
            domStorageEnabled
            cacheEnabled={false}
            incognito
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};
