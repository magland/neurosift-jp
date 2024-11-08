import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import NeurosiftChatWidgetContainer from './NeurosiftChatWidget';

/**
 * Initialization data for the neurosift-jp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'neurosift-jp:plugin',
  description: 'Neurosift Jupyter extension',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    palette: ICommandPalette
  ) => {
    console.log('JupyterLab extension neurosift-jp is activated!');

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
            console.log(`neurosift-jp: Kernel test: ${msg}`);
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

export default plugin;
