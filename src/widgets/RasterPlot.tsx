// Copyright (c) me
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from "@jupyter-widgets/base";

import { createRoot } from "react-dom/client";

import { useEffect, useState } from "react";
import {
  SetupTimeseriesSelection,
  useTimeseriesSelectionInitialization,
} from "../neurosift-lib/contexts/context-timeseries-selection";
import RasterPlotView3 from "../neurosift-lib/views/RasterPlotView3/RasterPlotView3";
import { SpikeTrainsClientType } from "../neurosift-lib/views/RasterPlotView3/SpikeTrainsClient";
import { MODULE_NAME, MODULE_VERSION } from "../version";

export class RasterPlotModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: RasterPlotModel.model_name,
      _model_module: RasterPlotModel.model_module,
      _model_module_version: RasterPlotModel.model_module_version,
      _view_name: RasterPlotModel.view_name,
      _view_module: RasterPlotModel.view_module,
      _view_module_version: RasterPlotModel.view_module_version,
      spike_times: [],
      spike_times_index: [],
      unit_ids: [],
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = "RasterPlotModel";
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = "RasterPlotView";
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}

export class RasterPlotView extends DOMWidgetView {
  root: any;
  render() {
    // this.el.classList.add("custom-widget");

    this.root = createRoot(this.el);

    this.data_changed();
    this.model.on("change:spike_times", this.data_changed, this);
    this.model.on("change:spike_times_index", this.data_changed, this);
    this.model.on("change:unit_ids", this.data_changed, this);
  }

  data_changed() {
    const spike_times = this.model.get("spike_times");
    const spike_times_index = this.model.get("spike_times_index");
    const unit_ids = this.model.get("unit_ids");
    this.root.render(
      <RasterPlot0
        spike_times={spike_times}
        spike_times_index={spike_times_index}
        unit_ids={unit_ids}
      />,
    );
    // this.el.textContent = this.model.get("value");
  }
}

type RasterPlot0Props = {
  spike_times: number[];
  spike_times_index: number[];
  unit_ids: string[];
};

const RasterPlot0: React.FC<RasterPlot0Props> = ({
  spike_times,
  spike_times_index,
  unit_ids,
}) => {
  const spikeTrainsClient = useSpikeTrainsClient({
    spikeTimes: spike_times,
    spikeTimesIndex: spike_times_index,
    unitIds: unit_ids,
  });

  useTimeseriesSelectionInitialization(
    spikeTrainsClient?.startTimeSec,
    spikeTrainsClient?.endTimeSec,
  );

  const [width, setWidth] = useState(0);
  const [divElement, setDivElement] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!divElement) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(divElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [divElement]);

  const height = 400;

  if (!spikeTrainsClient) return <div>Loading spike trains...</div>;
  return (
    <div ref={elmt => setDivElement(elmt)} style={{ position: "relative", width: '100%', height}}>
      <SetupTimeseriesSelection>
        <RasterPlotView3
          width={width - 10}
          height={height}
          spikeTrainsClient={spikeTrainsClient}
        />
      </SetupTimeseriesSelection>
    </div>
  );
};

const useSpikeTrainsClient = ({
  spikeTimes,
  spikeTimesIndex,
  unitIds,
}: {
  spikeTimes: number[];
  spikeTimesIndex: number[];
  unitIds: string[];
}) => {
  const [spikeTrainsClient, setSpikeTrainsClient] =
    useState<SpikeTrainsClientType | null>(null);
  useEffect(() => {
    setSpikeTrainsClient(null);
    let minTime = Infinity;
    let maxTime = -Infinity;
    for (let i = 0; i < spikeTimes.length; i++) {
      minTime = Math.min(minTime, spikeTimes[i]);
      maxTime = Math.max(maxTime, spikeTimes[i]);
    }
    const blockSizeSec = maxTime - minTime; // single block
    const getData = async (
      i1: number,
      i2: number,
      o: { unitIds?: (string | number)[] },
    ) => {
      const t1 = minTime + i1 * blockSizeSec;
      const t2 = minTime + i2 * blockSizeSec;
      const ret: {
        unitId: number | string;
        spikeTimesSec: number[];
      }[] = [];
      for (let ii = 0; ii < unitIds.length; ii++) {
        if (!o.unitIds || o.unitIds.includes(unitIds[ii])) {
          const i1 = ii === 0 ? 0 : spikeTimesIndex[ii - 1];
          const i2 = spikeTimesIndex[ii];
          const tt = spikeTimes.slice(i1, i2).filter((t) => t >= t1 && t < t2);
          ret.push({
            unitId: unitIds[ii],
            spikeTimesSec: tt,
          });
        }
      }
      return ret;
    };
    setSpikeTrainsClient({
      startTimeSec: minTime,
      endTimeSec: maxTime,
      blockSizeSec,
      unitIds,
      getData,
      totalNumSpikes: spikeTimes.length,
    });
  }, [spikeTimes, spikeTimesIndex]);
  return spikeTrainsClient;
};
