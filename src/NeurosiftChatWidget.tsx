import { ReactWidget } from "@jupyterlab/apputils";
import { Route, RouteContext } from "./neurosift-lib/contexts/useRoute";
import { useReducer } from "react";
import { chatReducer, emptyChat } from "./neurosift-lib/pages/ChatPage/Chat";
import { ChatContext } from "./neurosift-lib/pages/ChatPage/ChatContext";
import ChatWindow from "./neurosift-lib/pages/ChatPage/ChatWindow";

class NeurosiftChatWidgetContainer extends ReactWidget {
  constructor() {
    super();
  }

  render(): JSX.Element {
    return <NeurosiftChatWidget />;
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

const NeurosiftChatWidget = (): JSX.Element => {
  const [chat, chatDispatch] = useReducer(chatReducer, emptyChat);
  return (
    <RouteContext.Provider value={{route, setRoute}}>
      <div>
        Testing.
        <ChatWindow
          width={500}
          height={500}
          chat={chat}
          chatDispatch={chatDispatch}
          openRouterKey={null}
          chatContext={chatContext}
        />
      </div>
    </RouteContext.Provider>
  );
};

export default NeurosiftChatWidgetContainer;
