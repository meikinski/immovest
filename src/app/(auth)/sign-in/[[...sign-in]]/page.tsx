import { SignInSeite } from '@/components/auth/SignInSeite';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const erster = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/input-method');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show nothing while checking auth or if already signed in
  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--brand))]/5 via-white to-[hsl(var(--brand-2))]/5">
      {/* Header */}
      <div className="px-5 py-4 md:px-6 md:py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 md:h-12 md:w-12">
            <Image
              src="/logo.png"
              alt="imvestr Logo"
              width={48}
              height={48}
              className="h-full w-full rounded-lg"
              priority
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter">
            imvestr
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-5 pb-12 pt-2 md:px-6 md:py-12">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="mb-5 text-center md:mb-8">
            <h1 className="mb-1 text-2xl font-bold text-gray-900 md:mb-2 md:text-3xl">
              Willkommen zurück!
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Melde dich an, um deine Immobilienanalysen fortzusetzen
            </p>
          </div>

          {/* Clerk Sign In */}
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] hover:opacity-90 transition-opacity',
                card: 'shadow-2xl border-2 border-[hsl(var(--brand))]/10',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-[hsl(var(--brand))]/30',
                formFieldInput: 'border-2 border-gray-200 focus:border-[hsl(var(--brand))]',
                footerActionLink: 'text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-2))]',
              },
            }}
            fallbackRedirectUrl="/input-method"
            signUpUrl="/sign-up"
          />

          {/* Für Neue: unter dem Formular, damit der Login oben bleibt */}
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/70 p-4">
            <p className="flex items-start gap-2 text-sm font-bold text-[#001d3d]">
              <Gift size={18} className="mt-0.5 shrink-0 text-[#ff6b00]" />
              Neu hier? Mit kostenloser Registrierung {GRATIS_ANALYSEN === 1 ? '1\u00a0Wohnung' : `${GRATIS_ANALYSEN}\u00a0Wohnungen`} komplett analysieren.
            </p>
            <div className="mt-3 pl-[26px]"><GratisVorteilListe kompakt /></div>
            <Link
              href="/sign-up"
              className="mt-4 flex w-full items-center justify-center rounded-xl border-[1.5px] border-[#ff6b00] bg-white px-5 py-3 text-sm font-bold text-[#ff6b00] transition hover:bg-orange-50"
            >
              Jetzt kostenlos registrieren
            </Link>
            <p className="mt-2 text-center text-xs text-slate-500">Ohne Kreditkarte, kein Abo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
