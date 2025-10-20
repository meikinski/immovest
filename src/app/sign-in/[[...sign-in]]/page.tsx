import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center p-6">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 
              'bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90',
            card: 'shadow-xl',
          },
        }}
      />
    </div>
  );
}