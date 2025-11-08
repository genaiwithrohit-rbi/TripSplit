import React, { useState, useRef } from 'react';
import type { Friend } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, PencilIcon } from './icons';

interface FriendManagerScreenProps {
  friends: Friend[];
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
}

const FriendManagerScreen: React.FC<FriendManagerScreenProps> = ({ friends, setFriends }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);

  // Form state
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setEditingFriend(null);
    setId(crypto.randomUUID());
    setName('');
    setEmail('');
    setWhatsapp('');
    setPhoto(null);
    setIsModalOpen(true);
  };

  const openEditModal = (friend: Friend) => {
    setEditingFriend(friend);
    setId(friend.id);
    setName(friend.name);
    setEmail(friend.email);
    setWhatsapp(friend.whatsapp);
    setPhoto(friend.photo || null);
    setIsModalOpen(true);
  };

  const handleSaveFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      const friendData: Friend = { id, name, email, whatsapp, photo: photo || undefined };
      if (editingFriend) {
        setFriends(prev => prev.map(f => f.id === id ? friendData : f));
      } else {
        setFriends(prev => [...prev, friendData]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteFriend = (id: string) => {
    if (window.confirm('Are you sure you want to delete this friend? This may affect existing trips.')) {
        setFriends(prev => prev.filter(friend => friend.id !== id));
    }
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Friends</h2>
        <button
          onClick={openAddModal}
          className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transition-transform transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Friend
        </button>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Your friend list is empty.</h3>
          <p className="text-neutral dark:text-gray-400 mt-2">Add friends to start splitting expenses on your trips!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {friends.map(friend => (
              <li key={friend.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center">
                   {friend.photo ? (
                    <img src={friend.photo} alt={friend.name} className="h-10 w-10 rounded-full object-cover mr-4" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg mr-4">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{friend.name}</p>
                    <p className="text-sm text-neutral dark:text-gray-400">{friend.email}</p>
                    {friend.whatsapp && <p className="text-sm text-neutral dark:text-gray-400">{friend.whatsapp}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                   <button
                    onClick={() => openEditModal(friend)}
                    className="text-gray-500 hover:text-primary dark:hover:text-accent p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                    aria-label="Edit friend"
                   >
                    <PencilIcon className="w-5 h-5" />
                   </button>
                   <button
                    onClick={() => handleDeleteFriend(friend.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    aria-label="Delete friend"
                   >
                    <TrashIcon className="w-5 h-5" />
                   </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFriend ? "Edit Friend" : "Add a New Friend"}>
        <form onSubmit={handleSaveFriend} className="space-y-4">
           <div className="flex flex-col items-center space-y-2">
            {photo ? (
                <img src={photo} alt="Preview" className="h-24 w-24 rounded-full object-cover" />
            ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-accent hover:underline">
              {photo ? 'Change Photo' : 'Add Photo'}
            </button>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Number (Optional)</label>
            <input id="whatsapp" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400" disabled={!name.trim() || !email.trim()}>Save Friend</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FriendManagerScreen;