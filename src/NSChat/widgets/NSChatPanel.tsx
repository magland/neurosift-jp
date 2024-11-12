import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { ReactWidget } from "@jupyterlab/apputils";
import { NSChatDocModel } from '../../NSChat/models/NSChatDocModel';
import { NeurosiftChatWidget } from '../../NeurosiftChatWidget';
import { ChatAction, chatReducer, emptyChat } from '../../neurosift-lib/pages/ChatPage/Chat';

/**
 * Widget that contains the main view of the DocumentWidget.
 */
export class NSChatPanel extends ReactWidget {
  width = 500;
  height = 500;
  kernel: any | undefined;
  chatDispatch: (action: ChatAction) => void;

  /**
   * Construct a `NSChatPanel`.
   *
   * @param context - The documents context.
   */
  constructor(context: DocumentRegistry.IContext<NSChatDocModel>) {
    super();
    this.addClass('jp-nschat-canvas');

    this._model = context.model;
    this._clients = new Map<string, HTMLElement>();

    context.ready.then(value => {
      this._model.contentChanged.connect(this._onContentChanged);
      this._model.clientChanged.connect(this._onClientChanged);

      this._onContentChanged();

      context.sessionContext.initialize().then((ask) => {
        this.kernel = context.sessionContext.session?.kernel;
        this.update();
      });

      this.update();
    });

    this.chatDispatch = (action: ChatAction) => {
      const newChat = chatReducer(this._model.chat || emptyChat, action);
      if (this._model.chat !== newChat) {
        this._model.chat = newChat;
        this.update();
      }
    }

    this._onContentChanged();
  }

  render(): JSX.Element {
    return (
        <NeurosiftChatWidget
            jupyterKernel={this.kernel}
            width={this.width}
            height={this.height}
            onChatChanged={(chat: { messages: any[] }) => {
              if (this._model.chat !== chat) {
                this._model.chat = chat;
              }
            }}
            chat={this._model.chat || emptyChat}
            chatDispatch={this.chatDispatch}
        />
    );
  }

  onResize(msg: Widget.ResizeMessage): void {
    this.width = msg.width;
    this.height = msg.height;
    this.update();
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._model.contentChanged.disconnect(this._onContentChanged);
    Signal.clearData(this);
    super.dispose();
  }

  /**
   * Callback to listen for changes on the model. This callback listens
   * to changes on shared model's content.
   */
  private _onContentChanged = (): void => {
    // this._cube.style.left = this._model.position.x + 'px';
    // this._cube.style.top = this._model.position.y + 'px';
    // this._cube.innerText = this._model.content;
  };

  /**
   * Callback to listen for changes on the model. This callback listens
   * to changes on the different clients sharing the document.
   *
   * @param sender The DocumentModel that triggers the changes.
   * @param clients The list of client's states.
   */
  private _onClientChanged = (
    sender: NSChatDocModel,
    clients: Map<number, any>
  ): void => {
    clients.forEach((client, key) => {
      if (this._model.clientId !== key) {
        const id = key.toString();

        if (client.mouse) {
          if (this._clients.has(id)) {
            const elt = this._clients.get(id)!;
            elt.style.left = client.mouse.x + 'px';
            elt.style.top = client.mouse.y + 'px';
          } else {
            const el = document.createElement('div');
            el.className = 'jp-nschat-client';
            el.style.left = client.mouse.x + 'px';
            el.style.top = client.mouse.y + 'px';
            el.style.backgroundColor = client.user.color;
            el.innerText = client.user.name;
            this._clients.set(id, el);
            this.node.appendChild(el);
          }
        } else if (this._clients.has(id)) {
          this.node.removeChild(this._clients.get(id)!);
          this._clients.delete(id);
        }
      }
    });
  };

  private _clients: Map<string, HTMLElement>;
  private _model: NSChatDocModel;
}
