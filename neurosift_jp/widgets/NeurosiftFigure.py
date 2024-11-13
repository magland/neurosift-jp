class NeurosiftFigure:
    def __init__(
        self,
        *,
        nwb_url: str,
        item_path: str,
        view_plugin_name: str = "",
        height: int = 400,
    ) -> None:
        self.nwb_url = nwb_url
        self.item_path = item_path
        self.view_plugin_name = view_plugin_name
        self.height = height

    def _repr_mimebundle_(self, include=None, exclude=None):
        return {
            "application/vnd.neurosift-figure+json": {
                "nwb_url": self.nwb_url,
                "item_path": self.item_path,
                "view_plugin_name": self.view_plugin_name,
                "height": self.height,
            }
        }
