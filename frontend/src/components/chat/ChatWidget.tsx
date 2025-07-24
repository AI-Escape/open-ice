import { Button, Header } from '@cloudscape-design/components';
import { useState } from 'react';
import useWindowDimensions from '../../common/window';
import { ChatIcon } from './ChatIcon';
import { ChatBox } from './ChatBox';
import { ChatView } from './ChatView';

export default function ChatWidget() {
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const isMobile = width < 938;

  // Calculate dynamic size for desktop, ensuring it doesn't exceed window bounds
  // Max 96dvh total (2dvh margin on each side) and max 50% of window dimensions
  const maxWidth = Math.min(width - 40, width * 0.6, 1024); // 2dvh = ~40px, max 50% width
  const maxHeight = Math.min(height - 40, height * 0.7, 1024); // 2dvh = ~40px, max 50% height

  const containerClasses =
    isMobile || fullscreen
      ? 'fixed inset-0 bg-white flex flex-col p-4 shadow-lg border z-[3000]' // full screen
      : 'fixed bottom-[2dvh] right-[2dvh] bg-white flex flex-col p-4 shadow-2xl border rounded-lg z-[3000]';

  const containerStyle =
    !isMobile && !fullscreen
      ? {
          width: `${maxWidth}px`,
          height: `${maxHeight}px`,
        }
      : {};

  return (
    <>
      {open && (
        <>
          {/* Mobile backdrop only */}
          {(isMobile || fullscreen) && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[2999]"
              onClick={() => {
                setOpen(false);
                setFullscreen(false);
              }}
            />
          )}
          {/* Chat container */}
          <div className={containerClasses} style={containerStyle}>
            <div className="flex justify-between items-center border-b pb-2 mb-2">
              <Header
                variant="h2"
                description="ALICE is an AI assistant that can answer questions about immigration statistics"
              >
                Chat with ALICE
              </Header>
              <div className="flex items-center gap-2">
                {!isMobile && !fullscreen && (
                  <Button
                    variant="icon"
                    iconName="full-screen"
                    onClick={() => setFullscreen(true)}
                  />
                )}
                {!isMobile && fullscreen && (
                  <Button
                    variant="icon"
                    iconName="exit-full-screen"
                    onClick={() => setFullscreen(false)}
                  />
                )}
                <Button
                  variant="icon"
                  iconName="close"
                  onClick={() => {
                    setOpen(false);
                    setFullscreen(false);
                  }}
                />
              </div>
            </div>
            <ChatView />
          </div>
        </>
      )}
      {!open && (
        <div className="fixed bottom-[4dvh] right-[2dvh] z-3000">
          <Button variant="inline-link" onClick={() => setOpen(true)}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 group-hover:border-blue-300 group-hover:shadow-xl transition-all duration-300 hover:scale-105">
                <ChatIcon className="w-8 h-8 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
              </div>
            </div>
          </Button>
        </div>
      )}
    </>
  );
}
