import { DocumentChange } from '@jupyter/ydoc';

/**
 * Document structure
 */
export type SharedObject = {
  chat: {
    messages: any[];
    files?: { [name: string]: string };
  };
};

/**
 * Type representing the changes on the sharedModel.
 *
 * NOTE: Yjs automatically syncs the documents of the different clients
 * and triggers an event to notify that the content changed. You can
 * listen to this changes and propagate them to the widget so you don't
 * need to update all the data in the widget, you can only update the data
 * that changed.
 *
 * This type represents the different changes that may happen and ready to use
 * for the widget.
 */
export type NSChatDocChange = {
  chatChange?: { messages: any[], files?: { [name: string]: string } };
} & DocumentChange;
