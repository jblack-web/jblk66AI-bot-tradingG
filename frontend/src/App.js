import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pools from './pages/Pools';
import Stakers from './pages/Stakers';
import Payouts from './pages/Payouts';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import AdminManagement from './pages/AdminManagement';
import AuditLogs from './pages/AuditLogs';
import SecuritySettings from './pages/SecuritySettings';
import NotAuthorized from './pages/NotAuthorized';

const SUPER_ADMIN = ['SuperAdmin'];
const STAKING_ADMIN = ['SuperAdmin', 'StakingAdmin'];
const SUPPORT_ADMIN = ['SuperAdmin', 'SupportAdmin'];
const PAYOUT_ROLES = ['SuperAdmin', 'SupportAdmin', 'FinanceAdmin', 'AnalyticsAdmin'];
const ANALYTICS_ROLES = ['SuperAdmin', 'AnalyticsAdmin'];
const ALL_ROLES = ['SuperAdmin', 'StakingAdmin', 'SupportAdmin', 'FinanceAdmin', 'AnalyticsAdmin'];

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route exact path="/admin/login" component={Login} />
          <Route exact path="/admin/not-authorized" component={NotAuthorized} />
          <ProtectedRoute exact path="/admin/dashboard" component={Dashboard} allowedRoles={ALL_ROLES} />
          <ProtectedRoute exact path="/admin/pools" component={Pools} allowedRoles={STAKING_ADMIN} />
          <ProtectedRoute exact path="/admin/stakers" component={Stakers} allowedRoles={SUPPORT_ADMIN} />
          <ProtectedRoute exact path="/admin/payouts" component={Payouts} allowedRoles={PAYOUT_ROLES} />
          <ProtectedRoute exact path="/admin/analytics" component={Analytics} allowedRoles={ANALYTICS_ROLES} />
          <ProtectedRoute exact path="/admin/users" component={Users} allowedRoles={SUPER_ADMIN} />
          <ProtectedRoute exact path="/admin/admin-management" component={AdminManagement} allowedRoles={SUPER_ADMIN} />
          <ProtectedRoute exact path="/admin/audit-logs" component={AuditLogs} allowedRoles={SUPER_ADMIN} />
          <ProtectedRoute exact path="/admin/security" component={SecuritySettings} allowedRoles={SUPER_ADMIN} />
          <Redirect from="/admin" to="/admin/dashboard" exact />
          <Redirect from="/" to="/admin/login" />
        </Switch>
      </Router>
    </AuthProvider>
  );
}
