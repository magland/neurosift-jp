import { ReactWidget } from "@jupyterlab/apputils";
import { Widget } from "@lumino/widgets";
import { Route, RouteContext } from "./neurosift-lib/contexts/useRoute";
import { Chat, ChatAction, chatReducer, emptyChat } from "./neurosift-lib/pages/ChatPage/Chat";
import { ChatContext } from "./neurosift-lib/pages/ChatPage/ChatContext";
import ChatWindow from "./neurosift-lib/pages/ChatPage/ChatWindow";
import { JupyterConnectivityProvider } from "./neurosift-lib/pages/ChatPage/JupyterConnectivity";

class NeurosiftChatWidgetContainer extends ReactWidget {
  width = 500;
  height = 500;
  chat: Chat = emptyChat;
  chatDispatch: (action: ChatAction) => void;

  constructor(private jupyterKernel: any) {
    super();
    this.chatDispatch = (action: ChatAction) => {
      this.chat = chatReducer(this.chat, action);
      this.update();
    };
  }

  render(): JSX.Element {
    return <NeurosiftChatWidget jupyterKernel={this.jupyterKernel} width={this.width} height={this.height} chat={this.chat} chatDispatch={this.chatDispatch} />;
  }

  onResize(msg: Widget.ResizeMessage): void {
    this.width = msg.width;
    this.height = msg.height;
    this.update();
  }
}

const chatContext: ChatContext = {
  type: "main",
};

const route: Route = {
  page: "chat",
};

const setRoute = (route: Route) => {
  //
};

export const NeurosiftChatWidget: React.FC<{
  jupyterKernel: any,
  width: number,
  height: number,
  onChatChanged?: (chat: { messages: any[] }) => void,
  chat: Chat,
  chatDispatch: (action: ChatAction) => void,
}> = ({
  jupyterKernel,
  width,
  height,
  chat,
  chatDispatch
}) => {
  return (
    <RouteContext.Provider value={{route, setRoute}}>
      <JupyterConnectivityProvider
        mode="jupyterlab-extension"
        extensionKernel={jupyterKernel}
      >
        <ChatWindow
          width={width}
          height={height}
          chat={chat}
          chatDispatch={chatDispatch}
          openRouterKey={null}
          chatContext={chatContext}
          allowSaveChat={false}
        />
      </JupyterConnectivityProvider>
    </RouteContext.Provider>
  );
};

export default NeurosiftChatWidgetContainer;
