import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import NeurosiftFigureRenderer from './NeurosiftFigureRenderer';
import NeurosiftChatWidgetContainer from './NeurosiftChatWidget';
import { NSChatDocModelFactory, NSChatWidgetFactory } from './NSChat/factory';
import { NSChatDocWidget } from './NSChat/widgets/NSChatDocWidget';
import { MODULE_NAME, MODULE_VERSION } from './TestWidget/version';
import * as exampleWidgetExports from './TestWidget/widget';

/**
 * The name of the factory that creates editor widgets.
 */
const FACTORY = 'Neurosift Chat Editor';

/**
 * Initialization data for the neurosift-jp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'neurosift-jp:plugin',
  description: 'Neurosift Jupyter extension',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, ILayoutRestorer, IJupyterWidgetRegistry, IRenderMimeRegistry],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    registry: IJupyterWidgetRegistry,
    rendermime: IRenderMimeRegistry
  ) => {
    console.log('JupyterLab extension neurosift-jp is activated!');

    rendermime.addFactory(neurosiftFigureRendererFactory);

    registry.registerWidget({
      name: MODULE_NAME,
      version: MODULE_VERSION,
      exports: {...exampleWidgetExports}
    });

    // Namespace for the tracker
    const namespace = 'documents-nschat';
    // Creating the tracker for the document
    const widgetTracker = new WidgetTracker<NSChatDocWidget>({ namespace });

    // Handle state restoration.
    if (restorer) {
      // When restoring the app, if the document was open, reopen it
      restorer.restore(widgetTracker, {
        command: 'docmanager:open',
        args: widget => ({ path: widget.context.path, factory: FACTORY }),
        name: widget => widget.context.path
      });
    }

    // register the filetype
    app.docRegistry.addFileType({
      name: 'nschat',
      displayName: 'NSChat',
      mimeTypes: ['text/json', 'application/json'],
      extensions: ['.nschat'],
      fileFormat: 'text',
      contentType: 'nschatdoc' as any,
      iconClass: 'jp-MaterialIcon jp-CircleIcon',
    });

    // // Creating and registering the shared model factory
    // // As the third-party jupyter-collaboration package is not part of JupyterLab core,
    // // we should support collaboration feature absence.
    // if (drive) {
    //   const sharedNSChatFactory = () => {
    //     return NSChatDoc.create();
    //   };
    //   drive.sharedModelFactory.registerDocumentFactory(
    //     'nschatdoc',
    //     sharedNSChatFactory
    //   );
    // }

    // Creating and registering the model factory for our custom DocumentModel
    const modelFactory = new NSChatDocModelFactory();
    app.docRegistry.addModelFactory(modelFactory);

    // Creating the widget factory to register it so the document manager knows about
    // our new DocumentWidget
    const widgetFactory = new NSChatWidgetFactory({
      name: FACTORY,
      modelName: 'nschat-model',
      fileTypes: ['nschat'],
      defaultFor: ['nschat'],
      autoStartDefault: true,
      preferKernel: true,
      canStartKernel: true
    });

    // Add the widget to the tracker when it's created
    widgetFactory.widgetCreated.connect((sender, widget) => {
      // Notify the instance tracker if restore data needs to update.
      widget.context.pathChanged.connect(() => {
        widgetTracker.save(widget);
      });
      widgetTracker.add(widget);
    });

    // Registering the widget factory
    app.docRegistry.addWidgetFactory(widgetFactory);

    ///////////////////////////////////////////////////////////////////////////

    const { commands } = app;

    const command = 'neurosift-chat:open';
    commands.addCommand(command, {
      label: 'Open Neurosift Chat',
      execute: () => {
        const current = tracker.currentWidget;
        if (!current) {
          console.error('neurosift-jp: No active notebook');
          return;
        }
        const kernel = current.sessionContext.session?.kernel;
        if (!kernel) {
          console.error('neurosift-jp: No kernel');
          return;
        }
        const testKernel = () => {
          const future = kernel.requestExecute({
            code: 'print("Kernel connection test successful!")'
          });
          future.onIOPub = msg => {
            console.info(`neurosift-jp: Kernel test`, msg);
          };
        }
        testKernel();
        const content = new NeurosiftChatWidgetContainer(kernel);
        const widget = new MainAreaWidget({ content });
        widget.title.label = 'Neurosift';
        app.shell.add(widget, 'main');
      }
    });
    if (palette) {
      palette.addItem({
        command,
        category: 'Other'
      });
    }
  }
};

const neurosiftFigureRendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: ['application/vnd.neurosift-figure+json'],
  createRenderer: options => new NeurosiftFigureRenderer()
}

export default plugin;
