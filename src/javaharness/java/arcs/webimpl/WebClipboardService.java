package arcs.webimpl;

import arcs.api.ClipboardService;
import java.util.function.Consumer;
import javax.inject.Inject;

public class WebClipboardService implements ClipboardService {

  @Inject
  public WebClipboardService() {
  }

  @Override
  public void listen(Consumer<String> pasted) {
    // TODO(cromwellian): implement
  }
}