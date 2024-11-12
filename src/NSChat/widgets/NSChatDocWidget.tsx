import { DocumentWidget } from '@jupyterlab/docregistry';
import { NSChatPanel } from './NSChatPanel';
import { NSChatDocModel } from '../models/NSChatDocModel';

/**
 * DocumentWidget: widget that represents the view or editor for a file type.
 */
export class NSChatDocWidget extends DocumentWidget<
NSChatPanel,
NSChatDocModel
> {
  constructor(options: DocumentWidget.IOptions<NSChatPanel, NSChatDocModel>) {
    super(options);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this.content.dispose();
    super.dispose();
  }
}
