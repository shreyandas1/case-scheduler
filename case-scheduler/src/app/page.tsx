import { LoginForm } from "~/app/_components/login";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">Case Scheduler</h1>
          <p className="text-gray-300">Sign in with your username</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
