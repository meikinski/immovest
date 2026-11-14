import * as Sentry from '@sentry/nextjs';
import { sentryBasisOptionen } from '@/lib/monitoring/sentryOptionen';

Sentry.init(sentryBasisOptionen());
