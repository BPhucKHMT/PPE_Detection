import { createBrowserRouter, redirect } from 'react-router';
import { Root } from './layout/Root';
import { DashboardPage } from './pages/DashboardPage';
import { MonitorPage } from './pages/MonitorPage';
import { UploadPage } from './pages/UploadPage';
import { AlertsPage } from './pages/AlertsPage';
import { WorkersPage } from './pages/WorkersPage';
import { ReportsPage } from './pages/ReportsPage';
import { RulesPage } from './pages/RulesPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, loader: () => redirect('/dashboard') },
      { path: 'dashboard', Component: DashboardPage },
      { path: 'monitor',   Component: MonitorPage   },
      { path: 'upload',    Component: UploadPage    },
      { path: 'alerts',    Component: AlertsPage    },
      { path: 'workers',   Component: WorkersPage   },
      { path: 'reports',   Component: ReportsPage   },
      { path: 'rules',     Component: RulesPage     },
      { path: 'settings',  Component: SettingsPage  },
      { path: '*',         Component: NotFoundPage  },
    ],
  },
]);
