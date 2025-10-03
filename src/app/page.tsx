// src/app/page.tsx
import SignInScreen from '@/components/SignInScreen';

export default function Page() {
  // Sem redirect no servidor aqui. A tela de login cuida de empurrar o usuário ao dashboard no client.
  return <SignInScreen />;
}
