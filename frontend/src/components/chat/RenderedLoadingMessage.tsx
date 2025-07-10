import { Box, Spinner, StatusIndicator } from '@cloudscape-design/components';

import { LoadingMessage } from '../../common/chat/types';
import { toolCallMessages, ToolCallName } from '../../common/chat/tools';

export type RenderedLoadingMessageProps = {
  message: LoadingMessage;
};

export default function RenderedTextMessage(props: RenderedLoadingMessageProps) {
  const loadingMessage = props.message;
  // TODO add loading message for each tool call
  const text = 'Loading';

  return (
    <Box variant="p">
      {loadingMessage.error ? (
        <StatusIndicator type="error">{loadingMessage.name ? text : ''}</StatusIndicator>
      ) : loadingMessage.complete ? (
        <StatusIndicator type="success">{loadingMessage.name ? text : ''}</StatusIndicator>
      ) : (
        <>
          <Spinner size="normal" /> {loadingMessage.name ? text : ''}
        </>
      )}
    </Box>
  );
}
