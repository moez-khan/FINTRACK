'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'generating' | 'success' | 'error';
  fileName?: string;
  error?: string;
}

export default function PDFExportModal({ isOpen, onClose, status, fileName, error }: PDFExportModalProps) {
  const getTitle = () => {
    switch (status) {
      case 'generating':
        return 'Generating Report...';
      case 'success':
        return 'Report Generated Successfully';
      case 'error':
        return 'Export Failed';
      default:
        return 'Export Status';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'generating':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        );
      case 'success':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
        );
      case 'error':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => status === 'success' ? onClose() : {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="mt-2">
                  {getIcon()}
                  
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      {getTitle()}
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      {status === 'generating' && (
                        <p className="text-sm text-gray-500">
                          Please wait while we generate your financial report...
                        </p>
                      )}
                      
                      {status === 'success' && (
                        <>
                          <p className="text-sm text-gray-500 mb-3">
                            Your financial report has been generated and downloaded successfully.
                          </p>
                          {fileName && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-800">
                                File: {fileName}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Check your downloads folder
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">
                            {error || 'An error occurred while generating the report. Please try again.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {status !== 'generating' && (
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                      onClick={onClose}
                    >
                      {status === 'success' ? 'Done' : 'Close'}
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}