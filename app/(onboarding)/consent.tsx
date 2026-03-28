/**
 * Legacy consent route kept as a compatibility redirect.
 */

import { Redirect } from 'expo-router';

export default function ConsentRedirect() {
  return <Redirect href="/(onboarding)/profile" />;
}
