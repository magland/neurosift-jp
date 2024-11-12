import { YDocument } from '@jupyter/ydoc';
import { JSONValue, PartialJSONObject } from '@lumino/coreutils';
import * as Y from 'yjs';
import { NSChatDocChange } from './types';

/**
 * SharedModel, stores and shares the content between clients.
 */
export class NSChatDoc extends YDocument<NSChatDocChange> {
  constructor() {
    super();
    // Creating a new shared object and listen to its changes
    this._content = this.ydoc.getMap('content');
    this._content.observe(this._contentObserver);
  }

  readonly version: string = '1.0.0';

  // added by jfm
  getSource(): JSONValue | string {
    return this._content.toJSON();
  }

  // added by jfm
  setSource(value: JSONValue | string): void {
    throw Error('not implemented');
  }

  /**
   * Dispose of the resources.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._content.unobserve(this._contentObserver);
    super.dispose();
  }

  /**
   * Static method to create instances on the sharedModel
   *
   * @returns The sharedModel instance
   */
  static create(): NSChatDoc {
    return new NSChatDoc();
  }

  /**
   * Returns an the requested object.
   *
   * @param key The key of the object.
   * @returns The content
   */
  get(key: 'chat'): { messages: any[], files?: { [name: string]: string } } | null;
  get(key: string): any {
    let data: any;
    try {
        data = JSON.parse(this._content.get(key));
    }
    catch (e) {
        data = null
    }
    return data;
  }

  /**
   * Adds new data.
   *
   * @param key The key of the object.
   * @param value New object.
   */
  set(key: 'chat', value: { messages: any[], files?: { [name: string]: string } } | null): void;
  set(key: string, value: string | PartialJSONObject | null): void {
    this._content.set(key, value ? JSON.stringify(value) : null);
  }

  /**
   * Handle a change.
   *
   * @param event Model event
   */
  private _contentObserver = (event: Y.YMapEvent<any>): void => {
    const changes: NSChatDocChange = {};

    // Checks which object changed and propagates them.
    if (event.keysChanged.has('chat')) {
      changes.chatChange = JSON.parse(this._content.get('chat'));
    }

    this._changed.emit(changes);
  };

  private _content: Y.Map<any>;
}
