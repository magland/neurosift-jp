import { IRenderMime } from "@jupyterlab/rendermime-interfaces";
import { Widget } from "@lumino/widgets";
import { SetupTimeseriesSelection } from "./neurosift-lib/contexts/context-timeseries-selection";
import { NwbFileContext } from "./neurosift-lib/misc/NwbFileContext";
import { getRemoteH5File, getRemoteH5FileLindi, RemoteH5File, RemoteH5FileLindi, RemoteH5FileX } from "./neurosift-lib/remote-h5-file";
import { getViewPlugins, ViewPlugin } from "./neurosift-lib/viewPlugins/viewPlugins";
import { useEffect, useMemo, useState } from "react";
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
    console.log('--- model data', modelData)
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

type NeurosiftFigure0Props = {
  nwb_url: string;
  item_path: string;
  view_plugin_name: string;
  height: number;
};

const NeurosiftFigure0: React.FC<NeurosiftFigure0Props> = ({
  nwb_url,
  item_path,
  view_plugin_name,
  height,
}) => {
  const [divElement, setDivElement] = useState<HTMLDivElement | null>(null);
  const width = useFullWidth(divElement);

  const additionalItemPaths = useMemo(() => [], []);

  const nwbFileContextValue = useNwbFileContextValue(nwb_url);

  const [viewPlugin, setViewPlugin] = useState<ViewPlugin | undefined | null>(
    undefined,
  );
  useEffect(() => {
    let canceled = false;
    if (view_plugin_name) {
      const vps = getViewPlugins({ nwbUrl: nwb_url });
      const vp = vps.find((p) => p.name === view_plugin_name);
      if (vp) {
        setViewPlugin(vp);
      } else {
        setViewPlugin(null);
      }
    } else {
      const load = async () => {
        if (!nwbFileContextValue || !nwbFileContextValue.nwbFile) return;
        const grp = await nwbFileContextValue.nwbFile.getGroup(item_path);
        if (!grp) return;
        if (canceled) return;
        const neurodata_type = grp.attrs["neurodata_type"];
        if (!neurodata_type) return;
        const vps = getViewPlugins({ nwbUrl: nwb_url });
        const defaultViewPlugin = vps.find(
          (p) =>
            p.neurodataType === neurodata_type && p.defaultForNeurodataType,
        );
        if (defaultViewPlugin) {
          setViewPlugin(defaultViewPlugin);
        } else {
          setViewPlugin(null);
        }
      };
      load();
    }
    return () => {
      canceled = true;
    };
  }, [nwb_url, view_plugin_name, nwbFileContextValue, item_path]);

  return (
    <div
      ref={(elmt) => setDivElement(elmt)}
      style={{ position: "relative", width: "100%", height }}
    >
      {nwbFileContextValue && nwbFileContextValue.nwbFile ? (
        <NwbFileContext.Provider value={nwbFileContextValue}>
          <SetupTimeseriesSelection>
            {viewPlugin ? (
              <viewPlugin.component
                width={width ? width - 10 : 500}
                height={height}
                path={item_path}
                additionalPaths={additionalItemPaths}
                condensed={false}
                hidden={false}
                initialStateString={undefined}
                setStateString={undefined}
              />
            ) : viewPlugin === null ? (
              view_plugin_name ? (
                <div>View plugin not found: {view_plugin_name}</div>
              ) : (
                <div>No default view plugin found for neurodata type</div>
              )
            ) : (
              <div>...</div>
            )}
          </SetupTimeseriesSelection>
        </NwbFileContext.Provider>
      ) : (
        <div>Loading NWB file...</div>
      )}
    </div>
  );
};

const useFullWidth = (divElement: HTMLDivElement | null) => {
  const [width, setWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!divElement) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(divElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [divElement]);
  return width;
};

const useNwbFileContextValue = (nwb_url: string) => {
  const [nwbFile, setNwbFile] = useState<RemoteH5FileX | undefined>(undefined);
  useEffect(() => {
    let canceled = false;
    const load = async () => {
      if (canceled) return;
      let f: RemoteH5File | RemoteH5FileLindi;
      if (nwb_url.endsWith(".lindi.json") || nwb_url.endsWith(".lindi.tar")) {
        f = await getRemoteH5FileLindi(nwb_url);
      } else {
        f = await getRemoteH5File(nwb_url);
      }
      if (canceled) return;
      setNwbFile(f);
    };
    load();
    return () => {
      canceled = true;
    };
  }, [nwb_url]);
  if (!nwbFile) {
    return undefined;
  }
  return {
    nwbFile,
    neurodataItems: [],
  };
};

export default NeurosiftFigureRenderer;
