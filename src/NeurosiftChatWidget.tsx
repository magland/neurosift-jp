import { ReactWidget } from "@jupyterlab/apputils";
import { Widget } from "@lumino/widgets";
import { useReducer } from "react";
import { Route, RouteContext } from "./neurosift-lib/contexts/useRoute";
import { chatReducer, emptyChat } from "./neurosift-lib/pages/ChatPage/Chat";
import { ChatContext } from "./neurosift-lib/pages/ChatPage/ChatContext";
import ChatWindow from "./neurosift-lib/pages/ChatPage/ChatWindow";
import { JupyterConnectivityProvider } from "./neurosift-lib/pages/ChatPage/JupyterConnectivity";

class NeurosiftChatWidgetContainer extends ReactWidget {
  width = 500;
  height = 500;

  constructor(private jupyterKernel: any) {
    super();
  }

  render(): JSX.Element {
    return <NeurosiftChatWidget jupyterKernel={this.jupyterKernel} width={this.width} height={this.height} />;
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

const NeurosiftChatWidget: React.FC<{ jupyterKernel: any, width: number, height: number }> = ({
  jupyterKernel,
  width,
  height,
}) => {
  const [chat, chatDispatch] = useReducer(chatReducer, emptyChat);

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
        />
      </JupyterConnectivityProvider>
    </RouteContext.Provider>
  );
};

export default NeurosiftChatWidgetContainer;
