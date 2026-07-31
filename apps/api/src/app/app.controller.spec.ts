import { AppController } from './app.controller';

describe('AppController', () => {
  it('returns platform information', () => {
    const controller = new AppController();

    expect(controller.getPlatformInfo()).toEqual({
      name: 'Tarweej Platform API',
      status: 'operational',
      documentation: '/docs',
    });
  });
});
