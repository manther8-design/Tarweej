import { AppController } from './app.controller';

describe('AppController', () => {
  it('returns platform info', () => {
    const controller = new AppController();
    expect(controller.getPlatformInfo()).toMatchObject({
      name: 'Tarweej Platform API',
      status: 'operational',
    });
  });
});
