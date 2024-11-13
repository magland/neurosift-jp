import { IRenderMime } from "@jupyterlab/rendermime-interfaces";
import { Widget } from "@lumino/widgets";
import NeurosiftFigure0 from "./neurosift-lib/components/NeurosiftFigure0";
import { createRoot } from "react-dom/client";

class NeurosiftFigureRenderer extends Widget implements IRenderMime.IRenderer {
  root: any;
  constructor() {
    super();
    this.root = createRoot(this.node);
    this.root.render(<div>NeurosiftFigure</div>);
  }

  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    this.root.render(<div>NeurosiftFigure</div>);
    let modelData: any = model.data;
    if (!modelData) {
        return Promise.resolve();
    }
    const k = 'application/vnd.neurosift-figure+json';
    modelData = modelData[k];
    this.root.render(
    <NeurosiftFigure0
        nwb_url={modelData["nwb_url"] as string}
        item_path={modelData["item_path"] as string}
        view_plugin_name={(modelData["view_plugin_name"] || "") as string}
        height={modelData["height"] as number}
    />);
    return Promise.resolve();
  }
}

export default NeurosiftFigureRenderer;
