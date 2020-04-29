import './polyfills/Function';
import * as React from 'react';
import render from './render';
import AppContainer from './AppContainer';
import isClassComponent from './utils/isClassComponent';
import { AppLifecycle, callbackName, appEvents } from './lifecycle';
import AppInstanceContext from './AppInstanceContext';
import { ForwardRef } from './ReactIs';

class DefaultAppComponent extends React.Component {
  render() {
    return React.createElement(React.Fragment, null, this.props.children);
  }
}

export default function createAppConfig(this: any, App: any) {
  const createConfig = (AppComponent: React.ComponentType<any> = DefaultAppComponent) => {
    const config: any = {
      _container: new AppContainer(this),

      _pages: [] as any[],

      _instance: React.createRef<any>(),

      callLifecycle(lifecycle: AppLifecycle, ...args: any[]) {
        const callbacks = AppInstanceContext.lifecycleCallback[lifecycle] || [];
        let result;
        callbacks.forEach((callback: any) => {
          result = callback(...args);
        });
        if (result) {
          return result;
        }

        const callback = callbackName(lifecycle);
        if (this._instance.current && this._instance.current[callback]) {
          return this._instance.current[callback](...args);
        }
      },

      _mount(pageInstance: any) {
        this._pages.push(pageInstance);
        this._render();
      },

      _unmount(pageInstance: any) {
        this._pages.splice(this._pages.indexOf(pageInstance), 1);
        this._render();
      },

      _render() {
        const props: any = {};

        if (isClassComponent(AppComponent) || (AppComponent as any).$$typeof === ForwardRef) {
          props.ref = this._instance;
        }

        return render(
          React.createElement(
            AppComponent,
            props,
            this._pages.map((p: any) => p.element)
          ),
          this._container
        );
      },
    };

    const lifecycleEvent: any = {
      onLaunch(options: any) {
        this._render();

        return this.callLifecycle(AppLifecycle.launch, options);
      },

      onShow(options: any) {
        return this.callLifecycle(AppLifecycle.show, options);
      },

      onHide() {
        return this.callLifecycle(AppLifecycle.hide);
      },

      onError(error: any) {
        return this.callLifecycle(AppLifecycle.error, error);
      },

      // 阿里
      onShareAppMessage(options: any) {
        return this.callLifecycle(AppLifecycle.shareAppMessage, options);
      },

      // 微信
      onPageNotFound(options: any) {
        return this.callLifecycle(AppLifecycle.pageNotFound, options);
      },
    };

    appEvents().forEach(eventName => {
      if (lifecycleEvent[eventName]) {
        config[eventName] = lifecycleEvent[eventName];
      }
    });

    return config;
  };

  return createConfig(App);
}
