import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { Header } from 'components/header';
import { NotFound } from 'pages/404';
import { Dashboard } from './dashboard';
import { Profile } from './profile';
import { Explore } from './explore';
import { PostPage } from './post';

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />

      <Route path="/u/:username">
        <Profile />
      </Route>

      <Route path="/p/:postId">
        <PostPage />
      </Route>

      <Route path="/explore">
        <Explore />
      </Route>

      <Route path="/not-found">
        <NotFound />
      </Route>

      <Redirect to="/dashboard" />
    </Switch>
  );
}

function AuthenticatedApp() {
  return (
    <div className="bg-gray-background">
      <Header />
      <AuthenticatedRoutes />
    </div>
  );
}

export default AuthenticatedApp;
