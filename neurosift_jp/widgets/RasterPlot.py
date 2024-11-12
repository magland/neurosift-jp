import numpy as np
from ipywidgets import DOMWidget
from traitlets import Unicode, List
from .._frontend import module_name, module_version


class RasterPlot(DOMWidget):
    _model_name = Unicode('RasterPlotModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('RasterPlotView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    spike_times = List([]).tag(sync=True)
    spike_times_index = List([]).tag(sync=True)
    unit_ids = List([]).tag(sync=True)

    @staticmethod
    def from_pynwb(x):
        r = RasterPlot()
        spike_times = []
        spike_times_index = []
        for i in range(len(x.spike_times_index)):
            st = x.spike_times_index[i].tolist()
            spike_times.extend(st)
            spike_times_index.append(len(spike_times))
        r.spike_times = spike_times
        r.spike_times_index = spike_times_index
        r.unit_ids = np.array(x.id[:]).tolist()
        return r
