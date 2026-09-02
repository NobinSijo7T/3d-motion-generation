from __future__ import annotations

import numpy as np

JOINTS = 22


def qinv(q: np.ndarray) -> np.ndarray:
    out = q.copy()
    out[..., 1:] *= -1
    return out


def qrot(q: np.ndarray, v: np.ndarray) -> np.ndarray:
    qvec = q[..., 1:]
    uv = np.cross(qvec, v)
    uuv = np.cross(qvec, uv)
    return v + 2 * (q[..., :1] * uv + uuv)


def recover_root_rot_pos(data: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rot_vel = data[..., 0]
    r_rot_ang = np.zeros_like(rot_vel)
    r_rot_ang[..., 1:] = rot_vel[..., :-1]
    r_rot_ang = np.cumsum(r_rot_ang, axis=-1)
    r_rot_quat = np.zeros(data.shape[:-1] + (4,), dtype=np.float32)
    r_rot_quat[..., 0] = np.cos(r_rot_ang)
    r_rot_quat[..., 2] = np.sin(r_rot_ang)
    r_pos = np.zeros(data.shape[:-1] + (3,), dtype=np.float32)
    r_pos[..., 1:, [0, 2]] = data[..., :-1, 1:3]
    r_pos = qrot(qinv(r_rot_quat), r_pos)
    r_pos = np.cumsum(r_pos, axis=-2)
    r_pos[..., 1] = data[..., 3]
    return r_rot_quat, r_pos


def recover_from_ric(data: np.ndarray, joints_num: int = JOINTS) -> np.ndarray:
    if data.ndim == 3:
        data = data[0]
    r_rot_quat, r_pos = recover_root_rot_pos(data)
    positions = data[..., 4 : (joints_num - 1) * 3 + 4]
    positions = positions.reshape(positions.shape[0], joints_num - 1, 3)
    positions = qrot(qinv(r_rot_quat)[:, None, :], positions)
    positions[..., 0] += r_pos[..., 0:1]
    positions[..., 2] += r_pos[..., 2:3]
    return np.concatenate([r_pos[:, None, :], positions], axis=1)


def to_joint_positions(array: np.ndarray, joints_num: int | None = JOINTS) -> np.ndarray:
    array = np.nan_to_num(np.asarray(array, dtype=np.float32))
    if array.ndim == 3 and array.shape[-1] == 3:
        if joints_num is None:
            return array[:, :, :3]
        if array.shape[1] >= joints_num:
            return array[:, :joints_num, :3]
        raise ValueError("Unexpected joint count")
    if array.ndim == 2 and array.shape[-1] >= 263:
        return recover_from_ric(array[..., :263], joints_num or JOINTS)
    if array.ndim == 3 and array.shape[-1] >= 263:
        return recover_from_ric(array[0, ..., :263], joints_num or JOINTS)
    raise ValueError("Unsupported motion tensor shape")
