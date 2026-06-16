import type { Application } from 'express';

import { createApp } from '../../src/app';

let _app: Application | undefined;

export function getTestApp(): Application {
  if (!_app) {
    _app = createApp();
  }
  return _app;
}
