import { IChangedArgs } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { PartialJSONValue } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { NSChatDoc } from './NSChatDoc';
import { NSChatDocChange } from './types';

/**
 * DocumentModel: this Model represents the content of the file
 */
export class NSChatDocModel implements DocumentRegistry.IModel {
  /**
   * Construct a new NSChatDocModel.
   *
   * @param options The options used to create a document model.
   */
  constructor(options: DocumentRegistry.IModelOptions<NSChatDoc>) {
    const { collaborationEnabled, sharedModel } = options;
    this._collaborationEnabled = !!collaborationEnabled;
    if (sharedModel) {
      this.sharedModel = sharedModel;
    } else {
      this.sharedModel = NSChatDoc.create();
    }

    // Listening for changes on the shared model to propagate them
    this.sharedModel.changed.connect(this._onSharedModelChanged);
    this.sharedModel.awareness.on('change', this._onClientChanged);
  }

  /**
   * Whether the model is collaborative or not.
   */
  get collaborative(): boolean {
    return this._collaborationEnabled;
  }

  /**
   * The default kernel name of the document.
   *
   * #### Notes
   * Only used if a document has associated kernel.
   */
  readonly defaultKernelName = 'nschat-kernel';

  /**
   * The default kernel language of the document.
   *
   * #### Notes
   * Only used if a document has associated kernel.
   */
  readonly defaultKernelLanguage = 'python';

  /**
   * The dirty state of the document.
   *
   * A document is dirty when its content differs from
   * the content saved on disk.
   */
  get dirty(): boolean {
    return this._dirty;
  }
  set dirty(newValue: boolean) {
    const oldValue = this._dirty;
    if (newValue === oldValue) {
      return;
    }
    this._dirty = newValue;
    this.triggerStateChange({
      name: 'dirty',
      oldValue,
      newValue
    });
  }

  /**
   * Whether the model is disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * The read only state of the document.
   */
  get readOnly(): boolean {
    return this._readOnly;
  }
  set readOnly(newValue: boolean) {
    if (newValue === this._readOnly) {
      return;
    }
    const oldValue = this._readOnly;
    this._readOnly = newValue;
    this.triggerStateChange({ name: 'readOnly', oldValue, newValue });
  }

  /**
   * The shared document model.
   */
  readonly sharedModel: NSChatDoc = NSChatDoc.create();

  /**
   * The client ID from the document
   *
   * ### Notes
   * Each browser sharing the document will get an unique ID.
   * Its is defined per document not globally.
   */
  get clientId(): number {
    return this.sharedModel.awareness.clientID;
  }

  /**
   * Shared object chat
   */
  get chat(): { messages: any[], files?: { [name: string]: string } } | null {
    return this.sharedModel.get('chat');
  }
  set chat(v: { messages: any[], files?: { [name: string]: string } } | null) {
    this.sharedModel.set('chat', v);
  }

  /**
   * get the signal clientChanged to listen for changes on the clients sharing
   * the same document.
   *
   * @returns The signal
   */
  get clientChanged(): ISignal<this, Map<number, any>> {
    return this._clientChanged;
  }

  /**
   * A signal emitted when the document content changes.
   *
   * ### Notes
   * The content refers to the data stored in the model
   */
  get contentChanged(): ISignal<this, void> {
    return this._contentChanged;
  }

  /**
   * A signal emitted when the document state changes.
   *
   * ### Notes
   * The state refers to the metadata and attributes of the model.
   */
  get stateChanged(): ISignal<this, IChangedArgs<any>> {
    return this._stateChanged;
  }

  /**
   * Dispose of the resources held by the model.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  /**
   * Should return the data that you need to store in disk as a string.
   * The context will call this method to get the file's content and save it
   * to disk
   *
   * @returns The data
   */
  toString(): string {
    const chat = this.sharedModel.get('chat');
    return JSON.stringify(chat, null, 2);
  }

  /**
   * The context will call this method when loading data from disk.
   * This method should implement the logic to parse the data and store it
   * on the datastore.
   *
   * @param data Serialized data
   */
  fromString(data: string): void {
    let obj: any;
    try {
        obj = JSON.parse(data);
    }
    catch (e) {
        obj = null;
    }
    this.sharedModel.transact(() => {
      this.sharedModel.set('chat', obj);
    });
  }

  /**
   * Serialize the model to JSON.
   *
   * #### Notes
   * This method is only used if a document model as format 'json', every other
   * document will load/save the data through toString/fromString.
   */
  toJSON(): PartialJSONValue {
    try {
        return JSON.parse(this.toString() || 'null');
    }
    catch (e) {
        return null;
    }
  }

  /**
   * Deserialize the model from JSON.
   *
   * #### Notes
   * This method is only used if a document model as format 'json', every other
   * document will load/save the data through toString/fromString.
   */
  fromJSON(value: PartialJSONValue): void {
    this.fromString(JSON.stringify(value));
  }

  /**
   * Initialize the model with its current state.
   */
  initialize(): void {
    return;
  }

  /**
   * Trigger a state change signal.
   */
  protected triggerStateChange(args: IChangedArgs<any>): void {
    this._stateChanged.emit(args);
  }

  /**
   * Trigger a content changed signal.
   */
  protected triggerContentChange(): void {
    this._contentChanged.emit(void 0);
    this.dirty = true;
  }

  /**
   * Callback to listen for changes on the sharedModel. This callback listens
   * to changes on the different clients sharing the document and propagates
   * them to the DocumentWidget.
   */
  private _onClientChanged = () => {
    const clients = this.sharedModel.awareness.getStates();
    this._clientChanged.emit(clients);
  };

  /**
   * Callback to listen for changes on the sharedModel. This callback listens
   * to changes on shared model's content and propagates them to the DocumentWidget.
   *
   * @param sender The sharedModel that triggers the changes.
   * @param changes The changes on the sharedModel.
   */
  private _onSharedModelChanged = (
    sender: NSChatDoc,
    changes: NSChatDocChange
  ): void => {
    if (changes.chatChange) {
      this.triggerContentChange();
    }
    if (changes.stateChange) {
      changes.stateChange.forEach(value => {
        if (value.name === 'dirty') {
          // Setting `dirty` will trigger the state change.
          // We always set `dirty` because the shared model state
          // and the local attribute are synchronized one way shared model -> _dirty
          this.dirty = value.newValue;
        } else if (value.oldValue !== value.newValue) {
          this.triggerStateChange({
            newValue: undefined,
            oldValue: undefined,
            ...value
          });
        }
      });
    }
  };

  private _dirty = false;
  private _isDisposed = false;
  private _readOnly = false;
  private _clientChanged = new Signal<this, Map<number, any>>(this);
  private _contentChanged = new Signal<this, void>(this);
  private _collaborationEnabled: boolean;
  private _stateChanged = new Signal<this, IChangedArgs<any>>(this);
}
